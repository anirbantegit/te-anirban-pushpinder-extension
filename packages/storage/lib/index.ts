import { createStorage } from './base';
import { exampleThemeStorage } from './exampleThemeStorage';
import { blockedVideosByTabStorage } from './blockedVideosByTabStorage';
import { extensionStorage } from './extensionStorage';
import { SessionAccessLevelEnum, StorageEnum, EnumExtensionStorageListMode } from './enums';
import type { BaseStorage, IBlockedVideoDetails, typeExtensionVideoData, typeExtensionStorage } from './types';

export {
  exampleThemeStorage,
  extensionStorage,
  blockedVideosByTabStorage,
  createStorage,
  StorageEnum,
  SessionAccessLevelEnum,
  EnumExtensionStorageListMode,
};
export type { BaseStorage, IBlockedVideoDetails, typeExtensionVideoData, typeExtensionStorage };
