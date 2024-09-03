import { createStorage } from './base';
import { exampleThemeStorage } from './exampleThemeStorage';
import { blockedVideosByTabStorage } from './blockedVideosByTabStorage';
import { extensionStorage } from './extensionStorage';
import { SessionAccessLevelEnum, StorageEnum } from './enums';
import type { BaseStorage, BlockedVideoDetails, VideoData } from './types';

export {
  exampleThemeStorage,
  extensionStorage,
  blockedVideosByTabStorage,
  createStorage,
  StorageEnum,
  SessionAccessLevelEnum,
};
export type { BaseStorage, BlockedVideoDetails, VideoData };
