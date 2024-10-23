import 'webextension-polyfill';
import type { IBlockedVideoDetails, typeExtensionVideoData } from '@extension/storage';
import {
  blockedVideosByTabStorage,
  EnumExtensionStorageListMode,
  exampleThemeStorage,
  extensionStorage,
} from '@extension/storage';
import type { IAPIPayloadEither, IAPIVideoResponse, IPayloadVideo } from '@lib/background/types';

// Log the current theme for debugging purposes
exampleThemeStorage.get().then(theme => {
  console.log('Theme loaded:', theme);
});

console.log('Background script loaded');
console.log("Edit 'chrome-extension/lib/background/index.ts' and save to reload.");

// Debounce timers for each tab to manage rapid consecutive events
const debounceTimers: Record<number, ReturnType<typeof setTimeout>> = {};

// Abort controllers for each tab to cancel ongoing requests if necessary
const abortControllers: Record<number, AbortController> = {};

/**
 * Listener for incoming messages from content scripts or popup scripts
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'getCurrentTabId':
      handleGetCurrentTabId(sendResponse);
      return true; // Indicates asynchronous response

    case 'filterVideosForTab':
      console.log('HITTED...');
      handleFilterVideosForTab(message, sendResponse).finally();
      return true; // Indicates asynchronous response

    default:
      return false; // No asynchronous response needed for other actions
  }
});

/**
 * Handles fetching the current active tab ID
 * @param sendResponse - Callback function to send the response
 */
function handleGetCurrentTabId(sendResponse: (response: { tabId: number }) => void) {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    sendResponse({ tabId: tabs[0]?.id || 0 });
  });
}

// Add a request counter for each tab
const requestCounters: Record<number, number> = {};

// Utility function to increment the request counter
function incrementRequestCounter(tabId: number) {
  requestCounters[tabId] = (requestCounters[tabId] || 0) + 1;
}

// Utility function to decrement the request counter
function decrementRequestCounter(tabId: number) {
  if (requestCounters[tabId]) {
    requestCounters[tabId]--;
  }
}

// Utility function to check if the tab is still processing
function isTabStillProcessing(tabId: number) {
  return requestCounters[tabId] > 0;
}

/**
 * Handles filtering videos for a specific tab, with debouncing and aborting previous requests
 * @param message - The incoming message containing tabId and detectedVideos
 * @param sendResponse - Callback function to send the response
 */
async function handleFilterVideosForTab(
  message: { tabId: number; detectedVideos: typeExtensionVideoData[] },
  sendResponse: (response: { status: string; error?: string }) => void,
) {
  const { tabId, detectedVideos } = message;

  // Validate detectedVideos
  if (!detectedVideos || !Array.isArray(detectedVideos) || detectedVideos.length === 0) {
    await blockedVideosByTabStorage.updateIsProcessing(tabId, false);
    sendResponse({ status: 'error', error: 'No valid videos detected' });
    return;
  }
  console.log('REQUEST => ', { tabId, detectedVideos });

  const myExtensionStorage = await extensionStorage.get();

  // If listMode is DISABLED, show all videos and skip filtering
  if (myExtensionStorage.listMode === EnumExtensionStorageListMode.DISABLED) {
    await blockedVideosByTabStorage.updateTabBlacklist(tabId, detectedVideos, []);
    chrome.tabs.sendMessage(tabId, { action: 'filterVideosResponse', error: null, data: [] }); // Show all videos
    sendResponse({ status: 'success' });
    return;
  }

  const currentMode =
    myExtensionStorage.listMode === EnumExtensionStorageListMode.BLOCK_LIST
      ? myExtensionStorage.blockList
      : myExtensionStorage.allowList;

  // Clear the previous debounce timer if it exists
  clearDebounceTimer(tabId);

  // Cancel the previous request if it exists
  abortOngoingRequest(tabId);

  // Set up a new debounce timer
  debounceTimers[tabId] = setTimeout(async () => {
    try {
      // Increment the request counter and set the tab as processing
      incrementRequestCounter(tabId);
      await blockedVideosByTabStorage.updateIsProcessing(tabId, true);

      // Create a new AbortController for the new request
      abortControllers[tabId] = new AbortController();
      const { signal } = abortControllers[tabId];

      const { filterList } = currentMode;

      // Fetch instructions, filter list, and block/allow list setting from storage
      const { instructions, listMode } = myExtensionStorage;

      // Initialize the payload with the detected videos
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      const payload: IAPIPayloadEither = {};

      payload.videos = detectedVideos.map<IPayloadVideo>(detectedVideo => ({
        video_id: detectedVideo.videoId,
        timestamp: Math.floor(Date.now() / 1000),
        title: detectedVideo.title,
        thumbnail_url: detectedVideo.thumbnail,
        channel_name: detectedVideo.channel,
        channel_id: detectedVideo.channelId,
        channel_url: `https://youtube.com/@${detectedVideo.channelId}`,
      })) as IPayloadVideo[];

      // Prepare filters and assign them to the appropriate list
      const filters: string[] = filterList ?? [];
      if (instructions) filters.push(instructions);

      switch (listMode) {
        case EnumExtensionStorageListMode.BLOCK_LIST:
          payload.block_list = filters;
          break;
        case EnumExtensionStorageListMode.ALLOW_LIST:
          payload.allow_list = filters;
          break;
      }

      console.log('payload => ', { payload });

      // Send the API request with the abort signal
      const response = await fetch('http://sageteams.org:12731/filterVideos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal,
      });

      console.log('RESP => ', { response });

      // Check if the response is OK
      if (!response.ok) {
        sendResponse({ status: 'error', error: `HTTP error! status: ${response.status}` });
        return;
      }

      const data = await response.json();

      // Check if data is an array before filtering
      if (!Array.isArray(data)) {
        sendResponse({ status: 'error', error: 'Invalid response data format' });
        return;
      }

      const blockedVideoIds: string[] = data
        .filter((datum: IAPIVideoResponse) => datum.blocked)
        .map(datum => datum.video_id);

      const blacklistedDetectedVideos: IBlockedVideoDetails[] = detectedVideos
        .filter(detectedVideo => blockedVideoIds.some(id => detectedVideo.videoId === id))
        .map(detectedVideo => ({
          videoId: detectedVideo.videoId,
          detectedAt: new Date(Date.now()).toISOString(), // Convert to ISO string
          title: detectedVideo.title,
          channel: detectedVideo.channel,
          channelId: detectedVideo.channelId,
          videoType: detectedVideo.videoType,
          thumbnail: detectedVideo.thumbnail,
        }));

      console.log('fff => ', blacklistedDetectedVideos);

      await blockedVideosByTabStorage.updateTabBlacklist(tabId, detectedVideos, blacklistedDetectedVideos);

      // Send the filtered video data back to the content script
      chrome.tabs.sendMessage(tabId, { action: 'filterVideosResponse', error: null, data: blockedVideoIds });
      sendResponse({ status: 'success' });
    } catch (error) {
      handleError(tabId, error as Error, sendResponse);
    } finally {
      decrementRequestCounter(tabId);
      if (!isTabStillProcessing(tabId)) {
        await blockedVideosByTabStorage.updateIsProcessing(tabId, false);
      } else {
        await blockedVideosByTabStorage.updateIsProcessing(tabId, true);
      }
      cleanupAfterRequest(tabId);
    }
    console.log('RRR => ', requestCounters);
  }, 300); // Adjust the debounce delay as needed (e.g., 300ms)
}

/**
 * Clears the debounce timer for the specified tab ID
 * @param tabId - The ID of the tab for which to clear the debounce timer
 */
function clearDebounceTimer(tabId: number) {
  if (debounceTimers[tabId]) {
    clearTimeout(debounceTimers[tabId]);
    delete debounceTimers[tabId];
  }
}

/**
 * Aborts any ongoing request for the specified tab ID
 * @param tabId - The ID of the tab for which to abort the ongoing request
 */
function abortOngoingRequest(tabId: number) {
  if (abortControllers[tabId]) {
    abortControllers[tabId].abort();
    delete abortControllers[tabId];
  }
}

/**
 * Handles errors during the filtering process
 * @param tabId - The ID of the tab where the error occurred
 * @param error - The error object caught during the request
 * @param sendResponse - Callback function to send the response
 */
function handleError(
  tabId: number,
  error: Error,
  sendResponse: (response: { status: string; error?: string }) => void,
) {
  if (error.name === 'AbortError') {
    console.log(`Request for tab ${tabId} was aborted.`);
  } else {
    console.error('Error filtering videos:', error);
    chrome.tabs.sendMessage(tabId, { action: 'filterVideosResponse', data: null, error: error.message });
  }
  sendResponse({ status: 'error', error: error.message });
}

/**
 * Cleans up after a request by removing the abort controller for the specified tab ID
 * @param tabId - The ID of the tab for which to cleanup
 */
function cleanupAfterRequest(tabId: number) {
  delete abortControllers[tabId];
}

/**
 * Listener for when a tab is closed. Clears associated storage and timers.
 */
chrome.tabs.onRemoved.addListener(async tabId => {
  // Clear the storage for the tab ID that was closed
  await blockedVideosByTabStorage.clearTabBlacklist(tabId);

  // Clear debounce timer and abort controller for the closed tab
  clearDebounceTimer(tabId);
  abortOngoingRequest(tabId);
});
