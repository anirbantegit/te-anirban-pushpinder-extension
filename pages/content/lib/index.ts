import { YouTubeChangeDetector } from './YouTubeChangeDetector';
import type { IBlockedVideoDetails, typeExtensionStorageData, typeExtensionVideoData } from '@extension/storage/lib';
import { blockedVideosByTabStorage, extensionStorage } from '@extension/storage/lib';

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
function sendFilterRequestToBackground(tabId: number, detectedVideos: typeExtensionVideoData[]) {
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

let detectedVideos: typeExtensionVideoData[] = [];
let extensionStorageData: typeExtensionStorageData | null = null;
const markingClassName: string = 'extension-blocked';

// Initialize the application
const init = async () => {
  const tabId: number = await getCurrentTabId();

  /**
   * Callback function to handle detected video content changes.
   * Filters out blacklisted videos and updates the DOM accordingly.
   */
  const onContentChange = async (videos: typeExtensionVideoData[], url: string) => {
    console.log('Current URL:', url);
    console.log('Detected videos:', videos);
    detectedVideos = videos;
    sendFilterRequestToBackground(tabId, videos);
  };

  /**
   * Filters detected videos by received blacklisted suggestions and channel blacklist.
   * @param blacklistedVideos - List of blacklisted video details from API.
   * @returns Filtered list of detected videos that are blacklisted by API or channel.
   */
  const filterDetectedVideosWithReceivedArgs = (blacklistedVideos: IBlockedVideoDetails[]): DetectedVideo[] => {
    const channelBlacklist = extensionStorageData?.channelBlockList || [];

    return detectedVideos.filter(video => {
      const isVideoBlacklistedByAPI = isVideoInBlacklist(blacklistedVideos, video.videoId);
      const isVideoBlacklistedByChannel = isChannelBlacklisted(video, channelBlacklist);

      return isVideoBlacklistedByAPI || isVideoBlacklistedByChannel;
    });
  };

  /**
   * Checks if a video is present in the blacklisted videos from API.
   * @param blacklistedVideos - List of blacklisted video details.
   * @param videoId - Video ID to check in blacklist.
   * @returns Boolean indicating if the video is blacklisted by API.
   */
  const isVideoInBlacklist = (blacklistedVideos: IBlockedVideoDetails[], videoId: string): boolean => {
    return blacklistedVideos.some(blacklistedVideo => blacklistedVideo.videoId === videoId);
  };

  /**
   * Checks if a video's channel is in the user's channel blacklist.
   * @param video - Video object containing channel information.
   * @param channelBlacklist - List of blacklisted channel IDs or names.
   * @returns Boolean indicating if the video is blacklisted by channel.
   */
  const isChannelBlacklisted = (video: typeExtensionVideoData, channelBlacklist: string[]): boolean => {
    if (!video) return false;

    const { channelId, channel } = video;
    console.log('XXX => ', { channelId, channel });
    const isChannelIdBlacklisted = !!(channelId && channelBlacklist.includes(channelId));
    const isChannelNameBlacklisted = !!(channel && channelBlacklist.includes(channel));

    return isChannelIdBlacklisted || isChannelNameBlacklisted;
  };

  /**
   * Clear all DOM elements classes.
   */
  const clearAllPreviousDomClasses = () => {
    const elementsWithBlockedClass = document.querySelectorAll(`.${markingClassName}`);
    elementsWithBlockedClass.forEach(element => {
      element.classList.remove(`${markingClassName}`);
    });
  };

  /**
   * Updates DOM elements based on blacklist status.
   */
  const updateDomClasses = (blacklistedVideos: typeExtensionVideoData[]) => {
    blacklistedVideos.forEach(video => {
      if (!video.referenceDom.classList.contains(`${markingClassName}`)) {
        video.referenceDom.classList.add(`${markingClassName}`);
      }
    });
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
    return blockedVideosByTabStorage.subscribe(() => {
      blockedVideosByTabStorage.get().then(async data => {
        const { blacklisted } = data.tabs[tabId] ?? { blacklisted: [] };

        // Separate videos into blacklisted and non-blacklisted
        const detectedBlacklistedVideos: typeExtensionVideoData[] = filterDetectedVideosWithReceivedArgs(blacklisted);

        // Clear all previous classes
        clearAllPreviousDomClasses();

        // Update DOM classes based on blacklist status
        updateDomClasses(detectedBlacklistedVideos);

        // Log filtered videos for debugging purposes
        console.log('Videos in blacklist:', blacklisted);
      });
    });
  };

  /**
   * Fetches the initial blacklist and initializes the YouTube change detector.
   */

  extensionStorage.subscribe(async () => {
    extensionStorageData = await extensionStorage.get();
  });

  extensionStorage.get().then(data => {
    extensionStorageData = data;
    initializeDetector();
  });
  const unsubscribe = subscribeToBlacklistUpdates();
};

init().finally();
