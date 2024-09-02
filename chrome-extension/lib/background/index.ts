import 'webextension-polyfill';
import { exampleThemeStorage, blockedVideosByTabStorage } from '@extension/storage';

exampleThemeStorage.get().then(theme => {
  console.log('theme', theme);
});

console.log('background loaded');
console.log("Edit 'chrome-extension/lib/background/index.ts' and save to reload.");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getCurrentTabId') {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      sendResponse({ tabId: tabs[0]?.id || 0 });
    });
    return true; // Indicates that the response is asynchronous
  }
});

chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  // Clear the storage for the tab ID that was closed
  await blockedVideosByTabStorage.clearTabBlacklist(tabId);
});
