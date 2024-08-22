import { VideoData, YouTubeChangeDetector2 } from './YouTubeChangeDetector2';
import { videoBlacklistStorage } from '@extension/storage';

let blacklistedVideoIds: string[] = [];

const initializeDetector = () => {
  const onContentChange = (videos: VideoData[], url: string) => {
    console.log('Current URL:', url);
    console.log('Detected videos:', videos);

    // Filter out the blacklisted videos
    const filteredBlacklistedVideos = videos.filter(video => blacklistedVideoIds.includes(video.videoId));
    const filteredNotBlacklistedVideos = videos.filter(video => !blacklistedVideoIds.includes(video.videoId));

    // Add 'blocked' class to blacklisted videos
    filteredBlacklistedVideos.forEach(video => {
      if (!video.referenceDom.classList.contains('blocked')) {
        video.referenceDom.classList.add('blocked');
      }
    });

    // Remove 'blocked' class from non-blacklisted videos
    filteredNotBlacklistedVideos.forEach(video => {
      if (video.referenceDom.classList.contains('blocked')) {
        video.referenceDom.classList.remove('blocked');
      }
    });

    // Log the filtered videos
    console.log('Videos in blacklist:', filteredBlacklistedVideos);
    console.log('Videos not in blacklist:', filteredNotBlacklistedVideos);
  };

  // Initialize the YouTube change detector with the callback function
  const detector = new YouTubeChangeDetector2(onContentChange);
};

// Subscribe to updates in the blacklist storage
const unsubscribe = videoBlacklistStorage.subscribe(() => {
  videoBlacklistStorage.get().then(data => {
    blacklistedVideoIds = data.blacklistedVideoIds;
    console.log('Updated blacklistedVideoIds:', blacklistedVideoIds);
  });
});

// Initial fetch to populate the blacklisted video IDs and then initialize the detector
videoBlacklistStorage.get().then(data => {
  blacklistedVideoIds = data.blacklistedVideoIds || [];
  console.log('Initial blacklistedVideoIds:', blacklistedVideoIds);
  initializeDetector();
});
