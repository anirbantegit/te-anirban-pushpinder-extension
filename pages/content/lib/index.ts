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

// Sends a message to the background script to filter videos
function sendFilterRequestToBackground(tabId: number, detectedVideos: typeExtensionVideoData[]) {
  if (!detectedVideos || detectedVideos.length === 0) return;

  chrome.runtime.sendMessage({ action: 'filterVideosForTab', tabId, detectedVideos }, response => {
    if (response.error) {
      console.error('Failed to filter videos:', response.error);
    } else {
      console.log('Filtered videos data:', response.data);
    }
  });
}

// Video Filtering Logic
const VideoFilter = {
  isShortsAllowed: (storageData: typeExtensionStorageData): boolean => storageData?.shortsAllow ?? false,
  isPlaylistAllowed: (storageData: typeExtensionStorageData): boolean => storageData?.playlistAllow ?? false,

  filterByType: (videos: typeExtensionVideoData[], storageData: typeExtensionStorageData): typeExtensionVideoData[] => {
    return videos.filter(vid => {
      if (VideoFilter.isShortsAllowed(storageData) && vid.videoType === 'shorts') return false;
      if (VideoFilter.isPlaylistAllowed(storageData) && vid.videoType === 'playlist') return false;
      return true;
    });
  },

  filterByBlacklist: (
    allDetectedVideos: typeExtensionVideoData[],
    blacklistedVideos: IBlockedVideoDetails[],
    storageData: typeExtensionStorageData,
  ): typeExtensionVideoData[] => {
    const channelBlacklist = storageData?.channelBlockList || [];
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

  clearBlockedClasses: () => {
    document
      .querySelectorAll(`.${DOMUpdater.markingClassName}`)
      .forEach(el => el.classList.remove(DOMUpdater.markingClassName));
  },

  updateBlockedClasses: (videos: typeExtensionVideoData[]) => {
    videos.forEach(video => video.referenceDom.classList.add(DOMUpdater.markingClassName));
  },
};

// Initialize the extension
const init = async () => {
  let allDetectedVideos: typeExtensionVideoData[] = [];
  const tabId = await getCurrentTabId();
  let extensionStorageData: typeExtensionStorageData | null = await extensionStorage.get();

  const handleOnClickAddToBlocklist = async (clickedVideo: typeExtensionVideoData) => {
    console.log('Clicked video => ', { clickedVideo });
    const blockedChannelList = await extensionStorage?.getChannelBlockList();
    const uniqueList = Array.from(new Set([...(blockedChannelList ?? []), clickedVideo.channelId]));
    await extensionStorage.updateChannelBlockList(uniqueList);
  };

  // YouTube content change handler
  const handleContentChange = (videos: typeExtensionVideoData[], url: string) => {
    console.log('Detected videos => ', videos);
    const filteredVideos = VideoFilter.filterByType(videos, extensionStorageData!);
    console.log('Filtered videos => ', videos);
    allDetectedVideos = filteredVideos;
    sendFilterRequestToBackground(tabId, filteredVideos);
  };

  // Subscribe to blacklist updates
  const subscribeToBlacklistUpdates = () => {
    blockedVideosByTabStorage.subscribe(async () => {
      const { blacklisted } = (await blockedVideosByTabStorage.get()).tabs[tabId] || { blacklisted: [] };
      console.log('BLACKLISTED 1 => ', blacklisted);
      const filteredVideos = VideoFilter.filterByBlacklist(allDetectedVideos, blacklisted, extensionStorageData!);

      DOMUpdater.clearBlockedClasses();
      DOMUpdater.updateBlockedClasses(filteredVideos);
    });
  };

  // Subscribe to extension storage updates
  extensionStorage.subscribe(async () => {
    extensionStorageData = await extensionStorage.get();
  });

  // Initialize content detector
  new YouTubeChangeDetector(handleContentChange, handleOnClickAddToBlocklist);

  // Subscribe to updates
  subscribeToBlacklistUpdates();
};

init().catch(console.error);
