import { createStorage } from './base';
import { StorageEnum, EnumExtensionStorageListMode } from './enums';
import type { typeExtensionStorage, typeExtensionStorageData } from './types';

const storage = createStorage<typeExtensionStorageData>(
  'extension-storage-key',
  {
    videoIdsToBeBlacklisted: [],
    instructions: null,
    filterList: [],
    listMode: EnumExtensionStorageListMode.BLOCK_LIST,
  },
  {
    storageEnum: StorageEnum.Local,
    liveUpdate: true,
  },
);

export const extensionStorage: typeExtensionStorage = {
  ...storage,

  ////// POPUP UIs -

  // To Update Instructions
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
      console.log('current.videoIdsToBeBlacklisted => ', { blk: videoIds, videoId });
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
