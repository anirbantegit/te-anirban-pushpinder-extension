import { createStorage, StorageType } from './base';

type BlacklistData = {
  blacklistedVideoIds: string[];
};

const blacklistStorage = createStorage<BlacklistData>('blacklist-storage-key', {
  blacklistedVideoIds: [],
}, {
  storageType: StorageType.Local,
  liveUpdate: true,
});

export const videoBlacklistStorage = {
  ...blacklistStorage,
  addVideoToBlacklist: async (videoId: string) => {
    await blacklistStorage.set(current => ({ ...current, blacklistedVideoIds: [...current.blacklistedVideoIds, videoId] }));
  },
  removeVideoFromBlacklist: async (videoId: string) => {
    await blacklistStorage.set(current => ({
      ...current,
      blacklistedVideoIds: current.blacklistedVideoIds.filter(id => id !== videoId)
    }));
  },
  isVideoBlacklisted: async (videoId: string) => {
    const { blacklistedVideoIds } = await blacklistStorage.get();
    return blacklistedVideoIds.includes(videoId);
  }
};
