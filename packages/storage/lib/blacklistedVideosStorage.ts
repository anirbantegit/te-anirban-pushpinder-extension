import { createStorage } from './base';
import { StorageEnum } from './enums';
import type { BlacklistedVideosStorage, BlacklistedVideosData } from './types';

const storage = createStorage<BlacklistedVideosData>(
  'blacklisted-videos-storage-key',
  {
    videoIdsToBeBlacklisted: [],
    instructions: null,
  },
  {
    storageEnum: StorageEnum.Local,
    liveUpdate: true,
  },
);

export const blacklistedVideosStorage: BlacklistedVideosStorage = {
  ...storage,

  updateInstructions: async (instructions: null | string) => {
    await storage.set(current => ({
      ...current,
      instructions,
    }));
  },

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
