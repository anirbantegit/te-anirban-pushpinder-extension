export type VideoData = {
  videoId: string;
  title: string;
  referenceDom: HTMLElement;
  type: 'homepage' | 'sidebar' | 'search';
};

type ChangeCallback = (video: VideoData, url: string) => void;

export class YouTubeChangeDetector {
  private observer: MutationObserver;
  private currentUrl: string;
  private callback: ChangeCallback;

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
    const newVideos = this.queryVideosBasedOnUrl();
    newVideos.forEach((video) => {
      if (!video.referenceDom.classList.contains('detected-video')) {
        this.callback(video, this.currentUrl);
        video.referenceDom.classList.add('detected-video');
      }
    });
  }

  /**
   * Delays the mutation handler slightly after URL changes to ensure DOM updates are captured.
   */
  private onUrlChange() {
    setTimeout(() => {
      this.onMutation(); // Handle any changes after URL change
    }, 100); // Small delay to ensure DOM updates
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
    return this.queryVideos('ytd-compact-video-renderer', 'a.yt-simple-endpoint.style-scope.ytd-compact-video-renderer', 'sidebar');
  }

  /**
   * Queries and fetches videos from the YouTube homepage.
   */
  private queryHomepageVideos(): VideoData[] {
    return this.queryVideos('ytd-rich-item-renderer', 'a#video-title-link', 'homepage');
  }

  /**
   * Queries and fetches videos from YouTube search results.
   */
  private querySearchVideos(): VideoData[] {
    return this.queryVideos('ytd-video-renderer', 'a#video-title', 'search');
  }

  /**
   * Generalized video query function that works for different YouTube sections.
   */
  private queryVideos(containerSelector: string, anchorSelector: string, type: VideoData['type']): VideoData[] {
    const videoRenderers = document.querySelectorAll(containerSelector);
    const videoIdRegex = /\/watch\?v=([a-zA-Z0-9_-]{11})/;

    return Array.from(videoRenderers).map((renderer) => {
      const anchor = renderer.querySelector(anchorSelector);
      const href = anchor?.href ?? '';
      const videoIdMatch = href.match(videoIdRegex);

      if (videoIdMatch) {
        const videoId = videoIdMatch[1];
        const title = this.extractTitle(anchor);

        return {
          videoId,
          title,
          referenceDom: renderer as HTMLElement,
          type,
        };
      }
      return null;
    }).filter(item => item !== null) as VideoData[];
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
   * Disconnects the observer and removes event listeners.
   */
  disconnect() {
    this.observer.disconnect();
    window.removeEventListener('popstate', this.onUrlChange.bind(this));
    window.removeEventListener('pushState', this.onUrlChange.bind(this));
    window.removeEventListener('replaceState', this.onUrlChange.bind(this));
  }
}
