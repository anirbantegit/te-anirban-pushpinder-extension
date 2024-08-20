import { VideoData, YouTubeChangeDetector } from './YouTubeChangeDetector';

const onContentChange = (video: VideoData, url: string) => {
  console.log('Detected Video:', video);
  console.log('Current URL:', url);
};

const detector = new YouTubeChangeDetector(onContentChange);
