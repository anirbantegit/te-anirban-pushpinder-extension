import { createStorage } from './base';
import { StorageEnum } from './enums';
import type {
  BlockedVideosByTabStorage,
  BlockedVideosByTabData,
  IBlockedVideoDetails,
  typeExtensionVideoData,
  BlockedVideosTabData,
} from './types';

const storage = createStorage<BlockedVideosByTabData>(
  'blocked-videos-by-tab-storage-key',
  {
    tabs: {},
  },
  {
    storageEnum: StorageEnum.Local,
    sessionAccessForContentScripts: true,
    liveUpdate: true,
  },
);

export const blockedVideosByTabStorage: BlockedVideosByTabStorage = {
  ...storage,

  // Add video to the blacklist for a specific tab and update total detected videos count
  addVideoToTabBlacklist: async (
    tabId: number,
    detectedVideos: typeExtensionVideoData[],
    videoDetails: IBlockedVideoDetails,
  ) => {
    await storage.set(current => {
      const tabs = current.tabs || {}; // Ensure tabs is defined
      const existingTabData: BlockedVideosTabData = tabs[tabId] || {
        detectedVideos: [],
        blacklisted: [],
        isDetecting: false,
        isProcessing: false,
      };

      return {
        ...current,
        tabs: {
          ...tabs,
          [tabId]: {
            ...existingTabData,
            detectedVideos: detectedVideos,
            blacklisted: [...existingTabData.blacklisted, videoDetails],
          },
        },
      };
    });
  },

  // Update the blacklist for a specific tab at once
  updateTabBlacklist: async (
    tabId: number,
    detectedVideos: typeExtensionVideoData[],
    newBlacklist: IBlockedVideoDetails[],
  ) => {
    await storage.set(current => {
      const tabs = current.tabs || {}; // Ensure tabs is defined
      const existingTabData: BlockedVideosTabData = tabs[tabId] || {
        detectedVideos: [],
        blacklisted: [],
        isDetecting: false,
        isProcessing: false,
      };

      return {
        ...current,
        tabs: {
          ...tabs,
          [tabId]: {
            ...existingTabData,
            detectedVideos: detectedVideos, // Update detected videos as well
            blacklisted: newBlacklist, // Replace with the new blacklist
          },
        },
      };
    });
  },

  // Update whether detecting videos or not
  updateIsDetecting: async (tabId: number, isDetecting: boolean) => {
    await storage.set(current => {
      const tabs = current.tabs || {}; // Ensure tabs is defined
      const existingTabData: BlockedVideosTabData = tabs[tabId] || {
        detectedVideos: [],
        blacklisted: [],
        isDetecting: false,
        isProcessing: false,
      };

      return {
        ...current,
        tabs: {
          ...tabs,
          [tabId]: {
            ...existingTabData,
            isDetecting,
          },
        },
      };
    });
  },

  // Update whether processing videos or not
  updateIsProcessing: async (tabId: number, isProcessing: boolean) => {
    await storage.set(current => {
      const tabs = current.tabs || {}; // Ensure tabs is defined
      const existingTabData: BlockedVideosTabData = tabs[tabId] || {
        detectedVideos: [],
        blacklisted: [],
        isDetecting: false,
        isProcessing: false,
      };

      return {
        ...current,
        tabs: {
          ...tabs,
          [tabId]: {
            ...existingTabData,
            isProcessing,
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
};
