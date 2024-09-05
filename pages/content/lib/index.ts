import { YouTubeChangeDetector } from './YouTubeChangeDetector';
import type { IBlockedVideoDetails, typeExtensionVideoData } from '@extension/storage/lib';
import { extensionStorage, blockedVideosByTabStorage } from '@extension/storage/lib';

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
   * Filter detected videos by received blacklisted suggestions
   */
  const filterDetectedVideosByReceivedBlacklistedSuggestions = (blacklistedVideos: IBlockedVideoDetails[]) => {
    return detectedVideos.filter(video =>
      blacklistedVideos.some(blacklistedVideo => blacklistedVideo.videoId === video.videoId),
    );
  };

  /**
   * Updates DOM elements based on blacklist status.
   */
  const updateDomClasses = (blacklistedVideos: typeExtensionVideoData[]) => {
    const elementsWithBlockedClass = document.querySelectorAll(`.${markingClassName}`);
    elementsWithBlockedClass.forEach(element => {
      element.classList.remove(`${markingClassName}`);
    });

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
        const { blacklisted } = data.tabs[tabId] ?? null;

        // Separate videos into blacklisted and non-blacklisted
        const detectedBlacklistedVideos: typeExtensionVideoData[] =
          filterDetectedVideosByReceivedBlacklistedSuggestions(blacklisted);

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
    const data = await extensionStorage.getBlockList();
    console.log('getBlockList => ', { data });
  });

  extensionStorage.get().then(data => {
    initializeDetector();
  });
  const unsubscribe = subscribeToBlacklistUpdates();
};

init().finally();
