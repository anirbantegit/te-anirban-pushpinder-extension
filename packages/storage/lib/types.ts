import type { StorageEnum } from './enums';

export type ValueOrUpdate<D> = D | ((prev: D) => Promise<D> | D);

export type BaseStorage<D> = {
  get: () => Promise<D>;
  set: (value: ValueOrUpdate<D>) => Promise<void>;
  getSnapshot: () => D | null;
  subscribe: (listener: () => void) => () => void;
};

export type Theme = 'light' | 'dark';

export type ThemeStorage = BaseStorage<Theme> & {
  toggle: () => Promise<void>;
};

// Types for blacklisted videos
export type BlacklistedVideosData = {
  videoIdsToBeBlacklisted: string[];
  instructions: null | string;
  filterList: string[];
  isBlockList: boolean;
};

export type BlacklistedVideosStorage = BaseStorage<BlacklistedVideosData> & {
  updateInstructions: (instructions: string | null) => Promise<void>;
  addVideoToBlacklist: (videoId: string) => Promise<void>;
  updateVideoBlacklist: (newVideoIds: string[]) => Promise<void>;
  removeVideoFromBlacklist: (videoId: string) => Promise<void>;
  clearAllVideosFromBlacklist: () => Promise<void>;
  isVideoBlacklisted: (videoId: string) => Promise<boolean>;

  // New methods for managing the filter list
  addToFilterList: (filter: string) => Promise<void>;
  updateFilterList: (filter: string[]) => Promise<void>;
  removeFromFilterList: (filter: string) => Promise<void>;
  clearFilterList: () => Promise<void>;

  // New methods for handling the block or allow list type
  setIsBlockList: (isBlockList: boolean) => Promise<void>;
  getIsBlockList: () => Promise<boolean>;
};

export type VideoData = {
  videoId: string;
  title: string;
  thumbnail: string;
  channel: string;
  channelId: string;
  views: string;
  referenceDom: HTMLElement;
  videoType: string;
  type: 'homepage' | 'sidebar' | 'search';
};

export interface BlockedVideoDetails {
  videoId: string;
  title: string;
  channel: string;
  channelId: string;
  thumbnail: string;
  videoType: string;
  detectedAt: string; // ISO timestamp when the video was detected and blocked
}

// Types for blocked videos by tab
export type BlockedVideosByTabData = {
  tabs: {
    [tabId: number]: {
      detectedVideos: VideoData[];
      blacklisted: BlockedVideoDetails[];
    };
  };
};

export type BlockedVideosByTabStorage = BaseStorage<BlockedVideosByTabData> & {
  addVideoToTabBlacklist(tabId: number, detectedVideos: VideoData[], videoDetails: BlockedVideoDetails): Promise<void>;
  updateTabBlacklist(tabId: number, detectedVideos: VideoData[], videoDetails: BlockedVideoDetails[]): Promise<void>;
  removeVideoFromTabBlacklist(tabId: number, videoId: string): Promise<void>;
  isVideoBlacklistedInTab(tabId: number, videoId: string): Promise<boolean>;
  clearTabBlacklist(tabId: number): Promise<void>;
};

// Common configuration type
export type StorageConfig<D = string> = {
  /**
   * Assign the {@link StorageEnum} to use.
   * @default Local
   */
  storageEnum?: StorageEnum;
  /**
   * Only for {@link StorageEnum.Session}: Grant Content scripts access to storage area?
   * @default false
   */
  sessionAccessForContentScripts?: boolean;
  /**
   * Keeps state live in sync between all instances of the extension. Like between popup, side panel and content scripts.
   * To allow chrome background scripts to stay in sync as well, use {@link StorageEnum.Session} storage area with
   * {@link StorageConfig.sessionAccessForContentScripts} potentially also set to true.
   * @see https://stackoverflow.com/a/75637138/2763239
   * @default false
   */
  liveUpdate?: boolean;
  /**
   * An optional props for converting values from storage and into it.
   * @default undefined
   */
  serialization?: {
    /**
     * convert non-native values to string to be saved in storage
     */
    serialize: (value: D) => string;
    /**
     * convert string value from storage to non-native values
     */
    deserialize: (text: string) => D;
  };
};
