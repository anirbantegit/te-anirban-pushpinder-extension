import { createStorage, StorageType, type BaseStorage, SessionAccessLevel } from './base';
import { exampleThemeStorage } from './exampleThemeStorage';
import { videoBlacklistStorage } from './blacklistStorage';
import { userAuthStorage } from './authStorage';

export {
  videoBlacklistStorage,
  userAuthStorage,
  exampleThemeStorage,
  createStorage,
  StorageType,
  SessionAccessLevel,
  BaseStorage,
};
