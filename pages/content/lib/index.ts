import { YouTubeChangeDetector } from './YouTubeChangeDetector';
import type { IBlockedVideoDetails, typeExtensionStorageData, typeExtensionVideoData } from '@extension/storage';
import { blockedVideosByTabStorage, EnumExtensionStorageListMode, extensionStorage } from '@extension/storage';

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

// Sends a message to the background script to filter videos
function sendFilterRequestToBackground(tabId: number, detectedVideos: typeExtensionVideoData[]) {
  if (!detectedVideos || detectedVideos.length === 0) return;

  (async () => {
    await chrome.runtime.sendMessage({ action: 'filterVideosForTab', tabId, detectedVideos });
  })();
}

// Video Filtering Logic
const VideoFilter = {
  filterByType: (videos: typeExtensionVideoData[], storageData: typeExtensionStorageData): typeExtensionVideoData[] => {
    const currentList =
      storageData.listMode === EnumExtensionStorageListMode.BLOCK_LIST ? storageData.blockList : storageData.allowList;

    return videos.filter(vid => {
      if (currentList.shortsAllow && vid.videoType === 'shorts') return false;
      if (currentList.playlistAllow && vid.videoType === 'playlist') return false;
      return true;
    });
  },

  filterByBlacklist: (
    allDetectedVideos: typeExtensionVideoData[],
    blacklistedVideos: IBlockedVideoDetails[],
    storageData: typeExtensionStorageData,
  ): typeExtensionVideoData[] => {
    const currentList =
      storageData.listMode === EnumExtensionStorageListMode.BLOCK_LIST ? storageData.blockList : storageData.allowList;

    const channelBlacklist = currentList.channelBlockList || [];

    return allDetectedVideos.filter(video => {
      return (
        blacklistedVideos.some(bv => bv.videoId === video.videoId) ||
        (video.channelId && channelBlacklist.includes(video.channelId)) ||
        (video.channel && channelBlacklist.includes(video.channel))
      );
    });
  },
};

// DOM Manipulation Logic
const DOMUpdater = {
  markingClassName: 'extension-blocked',
  hidingClassName: 'extension-hide',

  clearBlockedClasses: () => {
    document
      .querySelectorAll(`.${DOMUpdater.markingClassName}, .${DOMUpdater.hidingClassName}`) // Clear both classes
      .forEach(el => {
        el.classList.remove(DOMUpdater.markingClassName);
        // el.classList.remove(DOMUpdater.hidingClassName); // Remove hiding class
      });
  },

  updateBlockedClasses: (videos: typeExtensionVideoData[]) => {
    videos.forEach(video => video.referenceDom.classList.add(DOMUpdater.markingClassName));
  },

  hideDetectedVideos: (videos: typeExtensionVideoData[]) => {
    // New method to hide videos
    videos.forEach(video => video.referenceDom.classList.add(DOMUpdater.hidingClassName));
  },

  showDetectedVideos: (videos: typeExtensionVideoData[]) => {
    // New method to show videos
    videos.forEach(video => video.referenceDom.classList.remove(DOMUpdater.hidingClassName));
  },
};

// Initialize the extension
const init = async () => {
  let youTubeChangeDetectorInstance: YouTubeChangeDetector | null = null;
  let allDetectedVideos: typeExtensionVideoData[] = [];
  const tabId = await getCurrentTabId();
  let extensionStorageData: typeExtensionStorageData | null = await extensionStorage.get();

  const handleOnClickAddToBlocklist = async (clickedVideo: typeExtensionVideoData) => {
    // Get current list mode
    const currentListMode = extensionStorageData?.listMode ?? EnumExtensionStorageListMode.DISABLED;

    if (currentListMode === EnumExtensionStorageListMode.DISABLED) {
      await blockedVideosByTabStorage.clearTabBlacklist(tabId);
    } else {
      // Fetch the appropriate list based on mode
      const blockedChannelList =
        extensionStorageData?.[currentListMode === EnumExtensionStorageListMode.ALLOW_LIST ? 'allowList' : 'blockList']
          ?.channelBlockList || [];

      const uniqueList = Array.from(
        new Set([...blockedChannelList, clickedVideo.channelId ?? clickedVideo.channel]),
      ).filter(uniqueItem => uniqueItem !== null) as string[];

      await extensionStorage.updateChannelBlockList(uniqueList);
    }
  };

  // YouTube content change handler
  const handleContentChange = (videos: typeExtensionVideoData[], url: string) => {
    blockedVideosByTabStorage.updateIsProcessing(tabId, true);
    // Hide all detected videos initially
    if (extensionStorageData?.listMode !== EnumExtensionStorageListMode.DISABLED) {
      DOMUpdater.hideDetectedVideos(videos);
    }
    const filteredVideos = VideoFilter.filterByType(videos, extensionStorageData!);
    allDetectedVideos = filteredVideos;
    sendFilterRequestToBackground(tabId, filteredVideos);
  };

  // Subscribe to blacklist updates
  const subscribeToBlacklistUpdates = () => {
    blockedVideosByTabStorage.subscribe(async () => {
      const tabData = (await blockedVideosByTabStorage.get()).tabs[tabId];
      const { blacklisted, isProcessing } = (await blockedVideosByTabStorage.get()).tabs[tabId] || {
        blacklisted: [],
        isProcessing: false,
      };

      console.log('BLACKLISTED 1 => ', { blacklisted, tabData });

      // If the list mode is DISABLED, show all videos
      if (extensionStorageData?.listMode === EnumExtensionStorageListMode.DISABLED) {
        DOMUpdater.showDetectedVideos(allDetectedVideos);
        return; // Skip further filtering
      }

      const filteredVideos = VideoFilter.filterByBlacklist(allDetectedVideos, blacklisted, extensionStorageData!);

      DOMUpdater.clearBlockedClasses();
      DOMUpdater.updateBlockedClasses(filteredVideos);

      if (isProcessing && extensionStorageData?.listMode !== EnumExtensionStorageListMode.DISABLED) {
        DOMUpdater.hideDetectedVideos(allDetectedVideos);
      } else {
        // Show non-blacklisted videos
        const nonBlacklistedVideos = allDetectedVideos.filter(
          video => !filteredVideos.some(filtered => filtered.videoId === video.videoId),
        );
        DOMUpdater.showDetectedVideos(nonBlacklistedVideos);
      }
    });
  };

  // Initialize content detector
  youTubeChangeDetectorInstance = new YouTubeChangeDetector(handleContentChange, handleOnClickAddToBlocklist);

  // Subscribe to extension storage updates
  extensionStorage.subscribe(async () => {
    console.log('CON1: Changes detected...');
    extensionStorageData = await extensionStorage.get();
    // location.reload();
    if (youTubeChangeDetectorInstance) {
      console.log('CON1: Send signal to change detector...', { extensionStorageData });
      DOMUpdater.clearBlockedClasses();
      await blockedVideosByTabStorage.clearTabBlacklist(tabId);
      youTubeChangeDetectorInstance?.searchAndFilter(true);
    } else {
      console.log('CON1: Not yet initialise the change detector...');
    }
  });

  // Subscribe to updates
  subscribeToBlacklistUpdates();
};

init().catch(console.error);
