import { createStorage, StorageType } from './base';

type AuthData = {
  userId: string;
  authToken: string;
  isLoggedIn: boolean;
};

const authStorage = createStorage<AuthData>('auth-storage-key', {
  userId: '',
  authToken: '',
  isLoggedIn: false,
}, {
  storageType: StorageType.Local,
  liveUpdate: true,
});

export const userAuthStorage = {
  ...authStorage,
  updateAuthToken: async (token: string) => {
    await authStorage.set(current => ({ ...current, authToken: token, isLoggedIn: true }));
  },
  clearAuthToken: async () => {
    await authStorage.set(current => ({ ...current, authToken: '', isLoggedIn: false }));
  },
  updateUserId: async (userId: string) => {
    await authStorage.set(current => ({ ...current, userId }));
  }
};
