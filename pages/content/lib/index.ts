import { VideoData, YouTubeChangeDetector } from './YouTubeChangeDetector';
import { videoBlacklistStorage } from '@extension/storage';

let blacklistedVideoIds: string[] = [];

const initializeDetector = () => {
  const onContentChange = (video: VideoData, url: string) => {
    console.log('blacklistedVideoIds => ', { blacklistedVideoIds });
    if (blacklistedVideoIds.includes(video.videoId)) {
      video.referenceDom.classList.add('blocked');
    }

    console.log('Detected Video:', video);
    console.log('Current URL:', url);
  };

  // Initialize the YouTube change detector with the callback function
  const detector = new YouTubeChangeDetector(onContentChange);
};

// Subscribe to updates in the blacklist storage
const unsubscribe = videoBlacklistStorage.subscribe(() => {
  videoBlacklistStorage.get().then(data => {
    blacklistedVideoIds = data.blacklistedVideoIds;
  });
});

// Initial fetch to populate the blacklisted video IDs and then initialize the detector
videoBlacklistStorage.get().then(data => {
  blacklistedVideoIds = data.blacklistedVideoIds;
  initializeDetector();
});
