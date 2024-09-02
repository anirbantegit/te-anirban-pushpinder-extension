import { YouTubeChangeDetector } from './YouTubeChangeDetector';
import type { BlockedVideoDetails, VideoData } from '@extension/storage/lib';
import { blacklistedVideosStorage, blockedVideosByTabStorage } from '@extension/storage/lib';

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
function sendFilterRequestToBackground(tabId: number, detectedVideos: VideoData[]) {
  // Send a message to the background script to filter videos
  chrome.runtime.sendMessage(
    {
      action: 'filterVideosForTab',
      tabId,
      detectedVideos,
    },
    response => {
      if (response.error) {
        console.error('Failed to filter videos:', response.error);
      } else {
        console.log('Filtered videos data:', response.data);
      }
    },
  );
}

let blacklistedVideoIds: string[] = [];
const markingClassName: string = 'extension-blocked';

// Initialize the application
const init = async () => {
  let tabId: number = await getCurrentTabId();

  /**
   * Callback function to handle detected video content changes.
   * Filters out blacklisted videos and updates the DOM accordingly.
   */
  const onContentChange = async (videos: VideoData[], url: string) => {
    console.log('Current URL:', url);
    console.log('Detected videos:', videos);

    // @ts-ignore
    sendFilterRequestToBackground(tabId, videos);

    // Separate videos into blacklisted and non-blacklisted
    const { blacklisted, notBlacklisted } = categorizeVideos(videos, blacklistedVideoIds);

    // Update DOM classes based on blacklist status
    updateDomClasses(blacklisted, notBlacklisted);

    // Store blacklisted videos in storage by tab ID
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
    // @ts-ignore
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

  blacklistedVideosStorage.get().then(data => {
    blacklistedVideoIds = Object.values(data.videoIdsToBeBlacklisted)
      .flat()
      .map(videoId => videoId);
    console.log('Initial blacklistedVideoIds:', blacklistedVideoIds);
    initializeDetector();
  });
  const unsubscribe = subscribeToBlacklistUpdates();
};

init().finally();
