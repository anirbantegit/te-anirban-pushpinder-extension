import { createStorage } from './base';
import { StorageEnum, EnumExtensionStorageListMode } from './enums';
import type { ListModeStorage, typeExtensionStorage, typeExtensionStorageData } from './types';

const defaultListModeStorage: ListModeStorage = {
  channelBlockList: [],
  shortsAllow: false,
  playlistAllow: false,
  bannerAllow: false,
};

const storage = createStorage<typeExtensionStorageData>(
  'extension-storage-key',
  {
    videoIdsToBeBlacklisted: [],
    instructions: null,
    filterList: [],
    listMode: EnumExtensionStorageListMode.BLOCK_LIST,
    allowList: defaultListModeStorage,
    blockList: defaultListModeStorage,
  },
  {
    storageEnum: StorageEnum.Local,
    liveUpdate: true,
  },
);

export const extensionStorage: typeExtensionStorage = {
  ...storage,

  // Helper function to get the current list based on mode
  getCurrentListMode: async () => {
    const { listMode, allowList, blockList } = await storage.get();
    return listMode === EnumExtensionStorageListMode.BLOCK_LIST ? blockList : allowList;
  },

  // Get channel block list based on current list mode
  getChannelBlockList: async (): Promise<string[]> => {
    const currentMode = await extensionStorage.getCurrentListMode();
    return currentMode.channelBlockList;
  },

  // Update channel block list based on current list mode
  updateChannelBlockList: async (list: string[]) => {
    const uniqueList = Array.from(new Set(list));
    await storage.set(current => {
      const currentMode =
        current.listMode === EnumExtensionStorageListMode.BLOCK_LIST ? current.blockList : current.allowList;
      return {
        ...current,
        [current.listMode === EnumExtensionStorageListMode.BLOCK_LIST ? 'blockList' : 'allowList']: {
          ...currentMode,
          channelBlockList: uniqueList,
        },
      };
    });
  },

  // Toggle shorts allow for the current mode
  updateShortsAllow: async (switchFeed: boolean) => {
    await storage.set(current => {
      const currentMode =
        current.listMode === EnumExtensionStorageListMode.BLOCK_LIST ? current.blockList : current.allowList;
      return {
        ...current,
        [current.listMode === EnumExtensionStorageListMode.BLOCK_LIST ? 'blockList' : 'allowList']: {
          ...currentMode,
          shortsAllow: !switchFeed,
        },
      };
    });
  },

  // Toggle playlist allow for the current mode
  updatePlayListAllow: async (switchFeed: boolean) => {
    await storage.set(current => {
      const currentMode =
        current.listMode === EnumExtensionStorageListMode.BLOCK_LIST ? current.blockList : current.allowList;
      return {
        ...current,
        [current.listMode === EnumExtensionStorageListMode.BLOCK_LIST ? 'blockList' : 'allowList']: {
          ...currentMode,
          playlistAllow: !switchFeed,
        },
      };
    });
  },

  // Toggle banner allow for the current mode
  updateBannerAllow: async (bannerAllow: boolean) => {
    await storage.set(current => {
      const currentMode =
        current.listMode === EnumExtensionStorageListMode.BLOCK_LIST ? current.blockList : current.allowList;
      return {
        ...current,
        [current.listMode === EnumExtensionStorageListMode.BLOCK_LIST ? 'blockList' : 'allowList']: {
          ...currentMode,
          bannerAllow: bannerAllow,
        },
      };
    });
  },

  // Update instructions
  updateInstructions: async (instructions: null | string) => {
    await storage.set(current => ({
      ...current,
      instructions,
    }));
  },

  //// filter list manage
  // Add a string to the filter list
  addToFilterList: async (filter: string) => {
    await storage.set(current => ({
      ...current,
      filterList: [...current.filterList, filter],
    }));
  },

  // Add a string to the filter list
  updateFilterList: async (filters: string[]) => {
    await storage.set(current => ({
      ...current,
      filterList: [...filters],
    }));
  },

  // Remove a string from the filter list
  removeFromFilterList: async (filter: string) => {
    await storage.set(current => ({
      ...current,
      filterList: current.filterList.filter(item => item !== filter),
    }));
  },

  // Clear the filter list
  clearFilterList: async () => {
    await storage.set(current => ({
      ...current,
      filterList: [],
    }));
  },

  //// IS BLOCKLIST OR NOT...
  // Set the list type (disabled, block or allow)
  setBlockList: async (listMode: EnumExtensionStorageListMode) => {
    await storage.set(current => ({
      ...current,
      listMode,
    }));
  },

  // Get the current list type
  getBlockList: async (): Promise<EnumExtensionStorageListMode> => {
    const { listMode } = await storage.get();
    return listMode;
  },

  ////// EXPERIMENTAL PURPOSES
  // Add video ID to the blacklist
  addVideoToBlacklist: async (videoId: string) => {
    await storage.set(current => {
      const videoIds = Array.isArray(current.videoIdsToBeBlacklisted) ? current.videoIdsToBeBlacklisted : [];
      return {
        ...current,
        videoIdsToBeBlacklisted: [...videoIds, videoId],
      };
    });
  },

  // Update the entire videoIdsToBeBlacklisted at once
  updateVideoBlacklist: async (newVideoIds: string[]) => {
    await storage.set(current => ({
      ...current,
      videoIdsToBeBlacklisted: [...newVideoIds], // Replace with the new list
    }));
  },

  // Remove video ID from the blacklist
  removeVideoFromBlacklist: async (videoId: string) => {
    await storage.set(current => ({
      ...current,
      videoIdsToBeBlacklisted: current.videoIdsToBeBlacklisted.filter(id => id !== videoId),
    }));
  },

  // Clear all videos from the blacklist
  clearAllVideosFromBlacklist: async () => {
    await storage.set(current => ({
      ...current,
      videoIdsToBeBlacklisted: [],
    }));
  },

  // Check if a video ID is in the blacklist
  isVideoBlacklisted: async (videoId: string) => {
    const { videoIdsToBeBlacklisted } = await storage.get();
    return videoIdsToBeBlacklisted.includes(videoId);
  },
};
