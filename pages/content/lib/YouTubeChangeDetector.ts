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

type ChangeCallback = (videos: VideoData[], url: string) => void;

export class YouTubeChangeDetector {
  private observer!: MutationObserver;
  private currentUrl!: string;
  private callback!: ChangeCallback;
  private previousVideoIds: Set<string> = new Set();

  constructor(callback: ChangeCallback) {
    if (!this.isYouTubeDomain()) {
      console.warn('YouTubeChangeDetector: Not on YouTube domain. Detector will not start.');
      return;
    }

    this.callback = callback;
    this.currentUrl = window.location.href;

    this.initializeMutationObserver();
    this.observeDomChanges();
    this.patchHistoryMethods();
  }

  /**
   * Checks if the current domain is YouTube.
   */
  private isYouTubeDomain(): boolean {
    return window.location.hostname.includes('youtube.com');
  }

  /**
   * Initializes the MutationObserver.
   */
  private initializeMutationObserver() {
    this.observer = new MutationObserver(this.onMutation.bind(this));
  }

  /**
   * Observes the DOM for changes under the ytd-app element.
   */
  private observeDomChanges() {
    const contentArea = document.querySelector('ytd-app');
    if (contentArea) {
      this.observer.observe(contentArea, { childList: true, subtree: true });
    }
  }

  /**
   * Handles DOM mutations, filtering and detecting video changes.
   */
  private onMutation() {
    const newVideos = this.queryVideosBasedOnUrl();
    this.handleVideoChanges(newVideos);
  }

  /**
   * Resets the `detected-video` class from all video elements.
   */
  private resetDetectedVideos() {
    const detectedVideos = document.querySelectorAll('.detected-video');
    detectedVideos.forEach(video => video.classList.remove('detected-video'));
  }

  /**
   * Handles URL changes and triggers a video search and filter.
   */
  private onUrlChange() {
    setTimeout(() => {
      const newVideos = this.queryVideosBasedOnUrl();
      this.handleVideoChanges(newVideos);
    }, 2000); // Adjust this delay if needed
  }

  /**
   * Handles detected video changes, triggering the callback if new videos are found.
   */
  private handleVideoChanges(newVideos: VideoData[]) {
    const newVideoIds = new Set(newVideos.map(video => video.videoId));

    if (!this.areSetsEqual(this.previousVideoIds, newVideoIds)) {
      this.previousVideoIds = newVideoIds;
      this.callback(newVideos, this.currentUrl);
    }
  }

  /**
   * Queries videos based on the current URL, distinguishing between homepage, sidebar, and search results.
   */
  private queryVideosBasedOnUrl(): VideoData[] {
    const url = window.location.href;

    if (url.includes('watch')) {
      return this.querySidebarVideos();
    } else if (url.includes('results')) {
      return this.querySearchVideos();
    } else {
      return this.queryHomepageVideos();
    }
  }

  /**
   * Queries and fetches sidebar videos from the YouTube watch view.
   */
  private querySidebarVideos(): VideoData[] {
    return this.queryVideos(
      'ytd-compact-video-renderer',
      'ytd-channel-name',
      'yt-image',
      'ytd-playlist-video-thumbnail-renderer',
      'div#metadata-line',
      'a.yt-simple-endpoint.style-scope.ytd-compact-video-renderer',
      'sidebar',
    );
  }

  /**
   * Queries and fetches videos from the YouTube homepage.
   */
  private queryHomepageVideos(): VideoData[] {
    return this.queryVideos(
      'ytd-rich-item-renderer',
      'ytd-channel-name',
      'ytd-playlist-video-thumbnail-renderer',
      'yt-image',
      'div#metadata-line',
      'a#video-title-link',
      'homepage',
    );
  }

  /**
   * Queries and fetches videos from YouTube search results.
   */
  private querySearchVideos(): VideoData[] {
    return this.queryVideos(
      'ytd-video-renderer',
      'ytd-channel-name',
      'ytd-playlist-video-thumbnail-renderer',
      ['yt-image img', 'a.ytd-thumbnail'],
      'div#metadata-line',
      'a#video-title',
      'search',
    );
  }

  /**
   * Generalized video query function that works for different YouTube sections.
   */
  private queryVideos(
    containerSelector: string,
    channelSelector: string,
    playlistSelector: string,
    thumbNailSelector: string | string[],
    metadataSelector: string,
    anchorSelector: string,
    type: VideoData['type'],
  ): VideoData[] {
    const videoRenderers = document.querySelectorAll(containerSelector);
    const videoIdRegex = /\/watch\?v=([a-zA-Z0-9_-]{11})/;

    return Array.from(videoRenderers)
      .map(renderer => {
        const anchor = renderer.querySelector(anchorSelector) as HTMLAnchorElement | null;
        const href = anchor?.href ?? '';
        const videoIdMatch = href.match(videoIdRegex);

        if (videoIdMatch) {
          const videoId = videoIdMatch[1];
          const title = this.extractTitle(anchor);
          // Handle thumbnail extraction
          let thumbnail = '';
          const thumbnailSelectors = Array.isArray(thumbNailSelector) ? thumbNailSelector : [thumbNailSelector];

          for (const selector of thumbnailSelectors) {
            const thumbnailElement = renderer.querySelector(selector) as HTMLImageElement | null;
            // console.log("thumbnailElement => ", {videoId, thumbnailElement});
            if (thumbnailElement) {
              if (selector.endsWith('img') || selector.includes('img.')) {
                thumbnail = thumbnailElement.src;
              } else {
                thumbnail = this.extractThumbnail(thumbnailElement);
              }
              break; // Stop at the first valid thumbnail found
            }
          }

          const channel = this.extractChannelTitle(renderer.querySelector(channelSelector));
          const channelId = this.extractChannelId(renderer.querySelector(channelSelector));
          const views = this.extractViews(renderer.querySelector(metadataSelector));
          const videoType = this.isPlaylist(renderer.querySelector(playlistSelector)) ? 'playlist' : 'video';

          const videoData: VideoData = {
            videoId,
            title,
            thumbnail,
            videoType,
            channel,
            channelId,
            views,
            referenceDom: renderer as HTMLElement,
            type,
          };

          videoData.referenceDom.classList.add('detected-video');
          return videoData;
        }
        return null;
      })
      .filter(item => item !== null) as VideoData[];
  }

  /**
   * Extracts the title from an anchor element.
   */
  private extractTitle(anchor: Element | null): string {
    if (!anchor) return '';
    return anchor.getAttribute('title')?.trim() || anchor.querySelector('span#video-title')?.textContent?.trim() || '';
  }

  /**
   * Extracts the thumbnail URL from an element.
   */
  private extractThumbnail(anchor: Element | null): string {
    return anchor?.querySelector('yt-image img')?.getAttribute('src')?.trim() || '';
  }

  /**
   * Determines if the video is part of a playlist.
   */
  private isPlaylist(anchor: Element | null): boolean {
    return !!anchor?.querySelector('yt-image img')?.getAttribute('src');
  }

  /**
   * Extracts the channel title from an element.
   */
  private extractChannelTitle(anchor: Element | null): string {
    return anchor?.querySelector('yt-formatted-string')?.getAttribute('title')?.trim() || '';
  }

  /**
   * Extracts the channel ID from an element.
   */
  private extractChannelId(anchor: Element | null): string {
    return anchor?.querySelector('yt-formatted-string a')?.getAttribute('href')?.trim() || '';
  }

  /**
   * Extracts the view count from an element.
   */
  private extractViews(anchor: Element | null): string {
    return anchor?.querySelector('span.inline-metadata-item')?.textContent?.trim() || '';
  }

  /**
   * Patches history methods to trigger events on pushState and replaceState.
   */
  private patchHistoryMethods() {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      const result = originalPushState.apply(history, args);
      window.dispatchEvent(new Event('pushState'));
      return result;
    };

    history.replaceState = (...args) => {
      const result = originalReplaceState.apply(history, args);
      window.dispatchEvent(new Event('replaceState'));
      return result;
    };
  }

  /**
   * Checks if two sets of video IDs are equal.
   */
  private areSetsEqual(set1: Set<string>, set2: Set<string>): boolean {
    if (set1.size !== set2.size) return false;
    for (const item of set1) {
      if (!set2.has(item)) return false;
    }
    return true;
  }

  /**
   * Manually triggers a video search and filter.
   */
  public searchAndFilter() {
    const newVideos = this.queryVideosBasedOnUrl();
    this.handleVideoChanges(newVideos);
  }

  /**
   * Disconnects the observer and removes event listeners.
   */
  public disconnect() {
    this.observer.disconnect();
    window.removeEventListener('popstate', this.onUrlChange.bind(this));
    window.removeEventListener('pushState', this.onUrlChange.bind(this));
    window.removeEventListener('replaceState', this.onUrlChange.bind(this));
  }
}
