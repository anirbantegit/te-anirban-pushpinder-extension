import { YouTubeChangeDetector } from './YouTubeChangeDetector';
import type { BlockedVideoDetails, VideoData } from '@extension/storage/lib';
import { blacklistedVideosStorage, blockedVideosByTabStorage } from '@extension/storage/lib';

let blacklistedVideoIds: string[] = [];
const markingClassName: string = 'extension-blocked';

/**
 * Callback function to handle detected video content changes.
 * Filters out blacklisted videos and updates the DOM accordingly.
 */
const onContentChange = async (videos: VideoData[], url: string) => {
  console.log('Current URL:', url);
  console.log('Detected videos:', videos);

  // Separate videos into blacklisted and non-blacklisted
  const { blacklisted, notBlacklisted } = categorizeVideos(videos, blacklistedVideoIds);

  console.log('TTT => blacklistedVideoIds => ', { blacklistedVideoIds });
  console.log('TTT => Blacklisted => ', { blacklisted });
  console.log('TTT => NOT Blacklisted => ', { notBlacklisted });

  // Update DOM classes based on blacklist status
  updateDomClasses(blacklisted, notBlacklisted);

  // Store blacklisted videos in storage by tab ID
  const tabId = await getCurrentTabId();
  console.log('Tab ID => ', { tabId });
  await storeBlockedVideos(tabId, videos, blacklisted);

  // Log filtered videos for debugging purposes
  console.log('Videos in blacklist:', blacklisted);
  console.log('Videos not in blacklist:', notBlacklisted);
};

/**
 * Categorizes videos into blacklisted and non-blacklisted.
 */
const categorizeVideos = (videos: VideoData[], blacklist: string[]) => {
  const blacklisted = videos.filter(video => blacklist.includes(video.videoId));
  const notBlacklisted = videos.filter(video => !blacklist.includes(video.videoId));

  return { blacklisted, notBlacklisted };
};

/**
 * Updates DOM elements based on blacklist status.
 */
const updateDomClasses = (blacklistedVideos: VideoData[], nonBlacklistedVideos: VideoData[]) => {
  const elementsWithBlockedClass = document.querySelectorAll(`.${markingClassName}`);
  elementsWithBlockedClass.forEach(element => {
    element.classList.remove(`${markingClassName}`);
  });

  blacklistedVideos.forEach(video => {
    if (!video.referenceDom.classList.contains(`${markingClassName}`)) {
      video.referenceDom.classList.add(`${markingClassName}`);
    }
  });

  /*nonBlacklistedVideos.forEach(video => {
    if (video.referenceDom.classList.contains('blocked')) {
      video.referenceDom.classList.remove('blocked');
    }
  });*/
};

/**
 * Stores blocked videos in the storage by tab ID.
 */
const storeBlockedVideos = async (tabId: number, detectedVideos: VideoData[], blacklistedVideos: VideoData[]) => {
  const timestamp = new Date().toISOString();

  // Clear old entries if it exists
  await blockedVideosByTabStorage.clearTabBlacklist(tabId);

  for (const video of blacklistedVideos) {
    const videoDetails: BlockedVideoDetails = {
      videoId: video.videoId,
      title: video.title,
      channel: video.channel,
      channelId: video.channelId,
      thumbnail: video.thumbnail,
      videoType: video.videoType,
      detectedAt: timestamp,
    };

    // Add the new entry
    await blockedVideosByTabStorage.addVideoToTabBlacklist(tabId, detectedVideos, videoDetails);
  }
};

/**
 * Initializes the YouTubeChangeDetector with the callback function.
 */
const initializeDetector = () => {
  const detector = new YouTubeChangeDetector(onContentChange);
};

/**
 * Subscribes to updates in the blacklist storage and refreshes the blacklisted video IDs.
 */
const subscribeToBlacklistUpdates = () => {
  return blacklistedVideosStorage.subscribe(() => {
    blacklistedVideosStorage.get().then(data => {
      blacklistedVideoIds = data.videoIdsToBeBlacklisted || [];
      console.log('Updated blacklistedVideoIds:', blacklistedVideoIds);
    });
  });
};

/**
 * Fetches the initial blacklist and initializes the YouTube change detector.
 */
const initialize = () => {
  blacklistedVideosStorage.get().then(data => {
    blacklistedVideoIds = Object.values(data.videoIdsToBeBlacklisted)
      .flat()
      .map(videoId => videoId);
    console.log('Initial blacklistedVideoIds:', blacklistedVideoIds);
    initializeDetector();
  });
};

// Helper function to get the current tab ID
const getCurrentTabId = async (): Promise<number> => {
  return new Promise<number>((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'getCurrentTabId' }, response => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response.tabId || 0);
      }
    });
  });
};

// Initialize the application
initialize();
const unsubscribe = subscribeToBlacklistUpdates();
