import type { VideoData } from './YouTubeChangeDetector';
import { YouTubeChangeDetector } from './YouTubeChangeDetector';
import { blacklistedVideosStorage } from '@extension/storage/lib';

let blacklistedVideoIds: string[] = [];

/**
 * Callback function to handle detected video content changes.
 * Filters out blacklisted videos and updates the DOM accordingly.
 */
const onContentChange = (videos: VideoData[], url: string) => {
  console.log('Current URL:', url);
  console.log('Detected videos:', videos);

  // Separate videos into blacklisted and non-blacklisted
  const { blacklisted, notBlacklisted } = categorizeVideos(videos, blacklistedVideoIds);

  // Update DOM classes based on blacklist status
  updateDomClasses(blacklisted, notBlacklisted);

  // Log filtered videos for debugging purposes
  console.log('Videos in blacklist:', blacklisted);
  console.log('Videos not in blacklist:', notBlacklisted);
};

/**
 * Categorizes videos into blacklisted and non-blacklisted.
 */
const categorizeVideos = (videos: VideoData[], blacklist: string[]) => {
  const blacklisted = videos.filter(video => blacklist.includes(video.videoId));
  const notBlacklisted = videos.filter(video => !blacklist.includes(video.videoId));

  return { blacklisted, notBlacklisted };
};

/**
 * Updates DOM elements based on blacklist status.
 */
const updateDomClasses = (blacklistedVideos: VideoData[], nonBlacklistedVideos: VideoData[]) => {
  blacklistedVideos.forEach(video => {
    if (!video.referenceDom.classList.contains('blocked')) {
      video.referenceDom.classList.add('blocked');
    }
  });

  nonBlacklistedVideos.forEach(video => {
    if (video.referenceDom.classList.contains('blocked')) {
      video.referenceDom.classList.remove('blocked');
    }
  });
};

/**
 * Initializes the YouTubeChangeDetector with the callback function.
 */
const initializeDetector = () => {
  const detector = new YouTubeChangeDetector(onContentChange);
};

/**
 * Subscribes to updates in the blacklist storage and refreshes the blacklisted video IDs.
 */
const subscribeToBlacklistUpdates = () => {
  return blacklistedVideosStorage.subscribe(() => {
    blacklistedVideosStorage.get().then(data => {
      blacklistedVideoIds = data.videoIdsToBeBlacklisted || [];
      console.log('Updated blacklistedVideoIds:', blacklistedVideoIds);
    });
  });
};

/**
 * Fetches the initial blacklist and initializes the YouTube change detector.
 */
const initialize = () => {
  blacklistedVideosStorage.get().then(data => {
    blacklistedVideoIds = data.videoIdsToBeBlacklisted || [];
    console.log('Initial blacklistedVideoIds:', blacklistedVideoIds);
    initializeDetector();
  });
};

// Initialize the application
initialize();
const unsubscribe = subscribeToBlacklistUpdates();
