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

export class YouTubeChangeDetector2 {
  private observer!: MutationObserver;
  private currentUrl!: string;
  private callback!: ChangeCallback;
  private previousVideoIds: Set<string> = new Set();

  constructor(callback: ChangeCallback) {
    if (!window.location.hostname.includes('youtube.com')) {
      console.warn('YouTubeChangeDetector: Not on YouTube domain. Detector will not start.');
      return;
    }

    this.callback = callback;
    this.currentUrl = window.location.href;

    // Initialize the MutationObserver to watch for DOM changes
    this.observer = new MutationObserver(this.onMutation.bind(this));
    this.observeDomChanges();

    // Listen for URL changes
    window.addEventListener('popstate', this.onUrlChange.bind(this));
    window.addEventListener('pushState', this.onUrlChange.bind(this)); // Custom event hook
    window.addEventListener('replaceState', this.onUrlChange.bind(this)); // Custom event hook

    // Patch history methods to trigger events
    this.patchHistoryMethods();
  }

  /**
   * Observes the DOM for changes, specifically under the ytd-app element.
   */
  private observeDomChanges() {
    const contentArea = document.querySelector('ytd-app');
    if (contentArea) {
      this.observer.observe(contentArea, { childList: true, subtree: true });
    }
  }

  /**
   * Handles DOM mutations and URL changes, fetching videos based on the current situation (homepage, sidebar, search).
   */
  private onMutation() {
    this.resetDetectedVideos();
    const newVideos = this.queryVideosBasedOnUrl();
    const newVideoIds = new Set(newVideos.map(video => video.videoId));
    if (!this.areSetsEqual(this.previousVideoIds, newVideoIds)) {
      this.previousVideoIds = newVideoIds;
      this.callback(newVideos, this.currentUrl);
    }
  }

  /**
   * Resets the `detected-video` class from all video elements.
   */
  private resetDetectedVideos() {
    const detectedVideos = document.querySelectorAll('.detected-video');
    detectedVideos.forEach(video => video.classList.remove('detected-video'));
  }

  /**
   * Delays the mutation handler slightly after URL changes to ensure DOM updates are captured.
   */
  private onUrlChange() {
    // debounce(this.onMutation(), 2000);
    const newVideos = this.queryVideosBasedOnUrl();
    const newVideoIds = new Set(newVideos.map(video => video.videoId));
    if (!this.areSetsEqual(this.previousVideoIds, newVideoIds)) {
      this.onMutation();
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
      'yt-image',
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
    thumbNailSelector: string,
    metadataSelector: string,
    anchorSelector: string,
    type: VideoData['type'],
  ): VideoData[] {
    const videoRenderers = document.querySelectorAll(containerSelector);
    const videoIdRegex = /\/watch\?v=([a-zA-Z0-9_-]{11})/;
    // return [{  videoId: "string",
    //   title: "string",
    //   thumbnail:"thumbnail",
    //   referenceDom: document.querySelector('body') as HTMLAnchorElement,
    //   type: 'homepage' }];
    return Array.from(videoRenderers)
      .map(renderer => {
        const anchor = renderer.querySelector(anchorSelector) as HTMLAnchorElement | null;
        const anchorplaylist = renderer.querySelector(playlistSelector) as HTMLAnchorElement;
        const anchorthumbnail = renderer.querySelector(thumbNailSelector) as HTMLAnchorElement;
        const anchorchannel = renderer.querySelector(channelSelector) as HTMLAnchorElement;
        const anchormetadata = renderer.querySelector(metadataSelector) as HTMLAnchorElement;
        const href = anchor?.href ?? '';
        const videoIdMatch = href.match(videoIdRegex);
        // console.log('anchorplaylist',anchorplaylist)

        if (videoIdMatch) {
          const videoId = videoIdMatch[1];
          const title = this.extractTitle(anchor);
          const thumbnail = this.extractThumbnail(anchorthumbnail);
          const channel = this.extractChannelTitle(anchorchannel);
          const channelId = this.extractChannelId(anchorchannel);
          const views = this.extractViews(anchormetadata);
          const videoType = this.extractPlaylist(anchorplaylist);
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

          // Mark as detected after querying
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

    // Attempt to get the title attribute
    let title = anchor.getAttribute('title')?.trim();

    // Fallback to text content if title attribute is not available
    if (!title) {
      const titleElement = anchor.querySelector('span#video-title');
      title = titleElement?.textContent?.trim() ?? '';
    }

    return title || ''; // Return an empty string if no title is found
  }
  private extractThumbnail(anchor: Element | null): string {
    if (!anchor) return '';

    // Attempt to get the thumbnail image URL
    const imgElement = anchor.querySelector('yt-image img');
    const thumbnailUrl = imgElement?.getAttribute('src')?.trim();

    return thumbnailUrl || ''; // Return an empty string if no thumbnail URL is found
  }
  private extractPlaylist(anchor: Element | null): string {
    if (!anchor) return '';

    // Attempt to get the thumbnail image URL
    const imgElement = anchor.querySelector('yt-image img');
    const playlistUrl = imgElement?.getAttribute('src')?.trim();
    // console.log('playlistUrl',playlistUrl)
    if (playlistUrl) {
      return 'playlist';
    } else {
      return 'video';
    }
  }
  private extractChannelTitle(anchor: Element | null): string {
    if (!anchor) return '';

    // Attempt to get the title from the yt-formatted-string element
    const ytFormattedString = anchor.querySelector('yt-formatted-string');
    const title = ytFormattedString?.getAttribute('title')?.trim();

    return title || ''; // Return an empty string if no title is found
  }
  private extractChannelId(anchor: Element | null): string {
    if (!anchor) return '';

    // Attempt to get the title from the yt-formatted-string element
    const ytFormattedString = anchor.querySelector('yt-formatted-string a');
    const channelid = ytFormattedString?.getAttribute('href')?.trim();

    return channelid || ''; // Return an empty string if no title is found
  }
  private extractViews(anchor: Element | null): string {
    if (!anchor) return '';

    // Attempt to get the views from the metadata line
    const viewsElement = anchor.querySelector('span.inline-metadata-item');
    const views = viewsElement?.textContent?.trim();

    return views || ''; // Return an empty string if no views are found
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
  private areSetsEqual(set1: Set<string>, set2: Set<string>): boolean {
    if (set1.size !== set2.size) return false;
    for (const item of set1) {
      if (!set2.has(item)) return false;
    }
    return true;
  }

  /**
   * Disconnects the observer and removes event listeners.
   */
  disconnect() {
    this.observer.disconnect();
    window.removeEventListener('popstate', this.onUrlChange.bind(this));
    window.removeEventListener('pushState', this.onUrlChange.bind(this));
    window.removeEventListener('replaceState', this.onUrlChange.bind(this));
  }
}
