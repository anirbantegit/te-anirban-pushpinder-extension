import 'webextension-polyfill';
import { exampleThemeStorage, blockedVideosByTabStorage, blacklistedVideosStorage } from '@extension/storage';
import type { VideoData } from '@extension/storage';

exampleThemeStorage.get().then(theme => {
  console.log('theme', theme);
});

console.log('background loaded');
console.log("Edit 'chrome-extension/lib/background/index.ts' and save to reload.");

const debounceTimers: { [key: number]: number } = {};
const abortControllers: { [key: number]: AbortController } = {};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getCurrentTabId') {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      sendResponse({ tabId: tabs[0]?.id || 0 });
    });
    return true; // Indicates that the response is asynchronous
  }

  if (message.action === 'filterVideosForTab') {
    const { tabId, detectedVideos } = message;

    // Clear the previous debounce timer if it exists
    if (debounceTimers[tabId]) {
      clearTimeout(debounceTimers[tabId]);
      delete debounceTimers[tabId];
    }

    // Cancel the previous request if it exists
    if (abortControllers[tabId]) {
      abortControllers[tabId].abort();
      delete abortControllers[tabId];
    }

    // Set up a new debounce timer
    debounceTimers[tabId] = setTimeout(async () => {
      try {
        // Create a new AbortController for the new request
        abortControllers[tabId] = new AbortController();
        const { signal } = abortControllers[tabId];

        // Get instructions from blacklistedVideosStorage
        const { instructions } = await blacklistedVideosStorage.get();

        // Prepare the request payload
        const payload = {
          filter_instruction: instructions,
          videos: detectedVideos.map((video: VideoData) => ({
            uuid: video.videoId,
            timestamp: 172526610, // Replace with actual timestamp if needed
            title: video.title,
            /*channelName: video.channel,
            channelId: video.channelId,
            views: video.views,*/
          })),
        };

        // Send the API request with the abort signal
        const response = await fetch('http://50.54.221.95:12731/filterVideos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal,
          mode: 'no-cors',
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Send the response back to the content script for the specific tab
        chrome.tabs.sendMessage(tabId, { action: 'filterVideosResponse', data });
        sendResponse({ status: 'success' }); // Respond to the original message
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log(`Request for tab ${tabId} was aborted.`);
        } else {
          console.error('Error filtering videos:', error);
          chrome.tabs.sendMessage(tabId, { action: 'filterVideosResponse', error: error.message });
        }
        sendResponse({ status: 'error', error: error.message }); // Respond to the original message
      } finally {
        // Cleanup abort controller after the request is done
        delete abortControllers[tabId];
      }
    }, 300); // Adjust the debounce delay as needed (e.g., 300ms)

    return true; // Indicates that the response is asynchronous
  }

  return false; // No asynchronous response needed for other actions
});

chrome.tabs.onRemoved.addListener(async tabId => {
  // Clear the storage for the tab ID that was closed
  await blockedVideosByTabStorage.clearTabBlacklist(tabId);

  // Clear debounce timer and abort controller for the closed tab
  if (debounceTimers[tabId]) {
    clearTimeout(debounceTimers[tabId]);
    delete debounceTimers[tabId];
  }

  if (abortControllers[tabId]) {
    abortControllers[tabId].abort();
    delete abortControllers[tabId];
  }
});
