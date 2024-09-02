import { createStorage } from './base';
import { exampleThemeStorage } from './exampleThemeStorage';
import { blockedVideosByTabStorage } from './blockedVideosByTabStorage';
import { blacklistedVideosStorage } from './blacklistedVideosStorage';
import { SessionAccessLevelEnum, StorageEnum } from './enums';
import type { BaseStorage, BlockedVideoDetails, VideoData } from './types';

export {
  exampleThemeStorage,
  blacklistedVideosStorage,
  blockedVideosByTabStorage,
  createStorage,
  StorageEnum,
  SessionAccessLevelEnum,
};
export type { BaseStorage, BlockedVideoDetails, VideoData };
