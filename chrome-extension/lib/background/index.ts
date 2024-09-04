import 'webextension-polyfill';
import type { VideoData, BlockedVideoDetails } from '@extension/storage';
import { blockedVideosByTabStorage, exampleThemeStorage, extensionStorage } from '@extension/storage';
import type { IAPIPayloadEither, IAPIResponse, IAPIVideoResponse, IPayloadVideo } from '@lib/background/types';

// Log the current theme for debugging purposes
exampleThemeStorage.get().then(theme => {
  console.log('Theme loaded:', theme);
});

console.log('Background script loaded');
console.log("Edit 'chrome-extension/lib/background/index.ts' and save to reload.");

// Debounce timers for each tab to manage rapid consecutive events
const debounceTimers: Record<number, number> = {};

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
      handleFilterVideosForTab(message, sendResponse);
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

/**
 * Handles filtering videos for a specific tab, with debouncing and aborting previous requests
 * @param message - The incoming message containing tabId and detectedVideos
 * @param sendResponse - Callback function to send the response
 */
function handleFilterVideosForTab(
  message: { tabId: number; detectedVideos: VideoData[] },
  sendResponse: (response: { status: string; error?: string }) => void,
) {
  const { tabId, detectedVideos } = message;

  // Validate detectedVideos
  if (!detectedVideos || !Array.isArray(detectedVideos) || detectedVideos.length === 0) {
    sendResponse({ status: 'error', error: 'No valid videos detected' });
    return;
  }

  // Clear the previous debounce timer if it exists
  clearDebounceTimer(tabId);

  // Cancel the previous request if it exists
  abortOngoingRequest(tabId);

  // Set up a new debounce timer
  debounceTimers[tabId] = setTimeout(async () => {
    try {
      // Create a new AbortController for the new request
      abortControllers[tabId] = new AbortController();
      const { signal } = abortControllers[tabId];

      // Fetch instructions, filter list, and block/allow list setting from storage
      const { instructions, filterList, isBlockList } = await extensionStorage.get();

      // Initialize the payload with the detected videos
      const payload: IAPIPayloadEither | object = {};

      payload.videos = detectedVideos.map<IPayloadVideo>(detectedVideo => ({
        uuid: detectedVideo.videoId,
        timestamp: Date.now(),
        title: detectedVideo.title,
        thumbnail_url: `https://img.youtube.com/vi/${detectedVideo.videoId}/hqdefault.jpg`,
        channel_name: detectedVideo.channel,
        channel_id: detectedVideo.channelId,
        channel_url: `https://youtube.com${detectedVideo.channelId}`,
      }));

      // Prepare filters and assign them to the appropriate list
      const filters: string[] = filterList ?? [];
      if (instructions) filters.push(instructions);

      if (isBlockList) {
        payload.block_list = filters;
      } else {
        payload.allow_list = filters;
      }

      // Send the API request with the abort signal
      const response = await fetch('http://50.54.221.95:12731/filterVideos', {
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

      const data = (await response.json()) as IAPIResponse;

      const blockedVideoIds: string[] = data
        .filter((datum: IAPIVideoResponse) => datum.blocked)
        .map(datum => datum.uuid);

      const blacklistedDetectedVideos: BlockedVideoDetails[] = detectedVideos
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
      handleError(tabId, error, sendResponse);
    } finally {
      // Cleanup the abort controller after the request is done
      cleanupAfterRequest(tabId);
    }
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
