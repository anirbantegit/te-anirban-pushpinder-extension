import { createStorage } from './base';
import { StorageEnum } from './enums';
import type { BlockedVideosByTabStorage, BlockedVideosByTabData, BlockedVideoDetails, VideoData } from './types';

const storage = createStorage<BlockedVideosByTabData>(
  'blocked-videos-by-tab-storage-key',
  {
    tabs: {},
  },
  {
    storageEnum: StorageEnum.Local,
    liveUpdate: true,
  },
);

export const blockedVideosByTabStorage: BlockedVideosByTabStorage = {
  ...storage,

  // Add video to the blacklist for a specific tab and update total detected videos count
  addVideoToTabBlacklist: async (tabId: number, detectedVideos: VideoData[], videoDetails: BlockedVideoDetails) => {
    await storage.set(current => {
      const tabs = current.tabs || {}; // Ensure tabs is defined
      const existingTabData = tabs[tabId] || { detectedVideos: [], blacklisted: [] };

      return {
        ...current,
        tabs: {
          ...tabs,
          [tabId]: {
            detectedVideos: detectedVideos,
            blacklisted: [...existingTabData.blacklisted, videoDetails],
          },
        },
      };
    });
  },

  // Remove video ID from the blacklist for a specific tab
  removeVideoFromTabBlacklist: async (tabId: number, videoId: string) => {
    await storage.set(current => ({
      ...current,
      tabs: {
        ...current.tabs,
        [tabId]: {
          ...current.tabs[tabId],
          blacklisted: (current.tabs[tabId]?.blacklisted || []).filter(video => video.videoId !== videoId),
        },
      },
    }));
  },

  // Check if a video ID is in the blacklist for a specific tab
  isVideoBlacklistedInTab: async (tabId: number, videoId: string) => {
    const { tabs } = await storage.get();
    return (tabs[tabId]?.blacklisted || []).some(video => video.videoId === videoId);
  },

  // Clear blacklist for a specific tab and reset detected videos count
  clearTabBlacklist: async (tabId: number) => {
    await storage.set(current => {
      if (!current.tabs) {
        return current; // If tabs is undefined, do nothing
      }

      const { [tabId]: _, ...rest } = current.tabs; // Remove the tabId entry
      return {
        ...current,
        tabs: rest,
      };
    });
  },

  // Get the total number of detected videos for a specific tab
  getTotalDetectedVideosForTab: async (tabId: number) => {
    const { tabs } = await storage.get();
    return tabs[tabId]?.detectedVideos || 0;
  },
};
