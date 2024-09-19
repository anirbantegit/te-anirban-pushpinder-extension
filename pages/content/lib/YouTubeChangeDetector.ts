import type { typeExtensionVideoData } from '@extension/storage/lib';
import imgContextMenuIcon from './assets/icon-34-new.png';

type typeDetectedVideoFeedsCallback = (videos: typeExtensionVideoData[], url: string) => void;
type typeAddToBlacklistClickCallback = (video: typeExtensionVideoData) => void;

export class YouTubeChangeDetector {
  private detectedVideos: typeExtensionVideoData[] = [];
  private observer!: MutationObserver;
  private currentUrl!: string;
  private callbackDetectedVideoFeeds!: typeDetectedVideoFeedsCallback;
  private callbackAddToBlacklistClick!: typeAddToBlacklistClickCallback;
  private previousVideoIds: Set<string> = new Set();
  private contextMenu: Element | null = null;
  private clickedVideo: typeExtensionVideoData | null = null;

  constructor(
    detectedVideoFeedsCallback: typeDetectedVideoFeedsCallback,
    addToBlacklistClickCallback: typeAddToBlacklistClickCallback,
  ) {
    if (!this.isYouTubeDomain()) {
      console.warn('YouTubeChangeDetector: Not on YouTube domain. Detector will not start.');
      return;
    }

    this.callbackDetectedVideoFeeds = detectedVideoFeedsCallback;
    this.callbackAddToBlacklistClick = addToBlacklistClickCallback;
    this.currentUrl = window.location.href;

    this.initializeMutationObserver();
    this.observeDomChanges();
    this.patchHistoryMethods();

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this;
    document.body.addEventListener('click', async event => {
      that.removeBlocklistMenuItem();

      const targetElement = event.target as Node | null;
      console.log('Clicked element:', targetElement);
      console.log('Detected videos:', that.detectedVideos);

      if (targetElement) {
        // Iterate through detectedVideos to find the one whose referenceDom contains the clicked target
        for (const video of that.detectedVideos) {
          if (video.referenceDom && video.referenceDom.contains(targetElement)) {
            console.log('Match found in detected video:', video);

            // Ensure the video has a channelId
            if (video.channelId) {
              that.contextMenu = await that.getContextMenuIfOpened();
              if (that.contextMenu) {
                that.addToBlocklistMenuItem(that.contextMenu);
              }
              console.log('Click is inside detected video:', video);
              that.clickedVideo = video;
              return video; // Return the detected video object or perform your action here
            }
          }
        }

        console.log('No matching video found for clicked element.');
      } else {
        console.log('No target element found in event.');
      }
      return true;
    });
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

  private getContextMenuIfOpened = async (interval: number = 50, timeout: number = 5000): Promise<Element | null> => {
    // Delay function
    const delayPromise = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const start = Date.now();

    while (Date.now() - start < timeout) {
      const domContextMenu: Element | null = document.querySelector('ytd-menu-popup-renderer');

      let isOpened = false;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      if (domContextMenu && domContextMenu.style.display) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        isOpened = domContextMenu.style.display !== 'none';
      } else if (domContextMenu) {
        isOpened = true;
      }

      if (isOpened) {
        return domContextMenu;
      }

      // Wait for the interval before checking again
      await delayPromise(interval);
    }

    // Return null if the menu was not found within the timeout period
    return null;
  };

  private addToBlocklistMenuItem = (domContextMenu: Element | null): void => {
    if (!domContextMenu) return;

    // Check if the "Add to Blocklist" button already exists
    const existingBlocklistButton: Element | null = domContextMenu.querySelector('.scopsee-custom-context-button');
    if (existingBlocklistButton) return; // If it exists, skip adding another one

    // Get the Report menu item (this will help place the new item above it)ytd-menu-service-item-renderer
    const menuItems = domContextMenu.querySelectorAll('tp-yt-paper-listbox ytd-menu-service-item-renderer');
    const reportMenuItem = menuItems[menuItems.length - 1] || null;

    if (!reportMenuItem) return;

    // Create the new "Add to Blocklist" item
    const blocklistItem = document.createElement('ytd-menu-service-item-renderer');
    blocklistItem.classList.add('style-scope', 'ytd-menu-popup-renderer', 'scopsee-custom-context-button');
    blocklistItem.setAttribute('role', 'menuitem');
    blocklistItem.setAttribute('tabindex', '-1');
    blocklistItem.setAttribute('aria-selected', 'false');

    // Create the <tp-yt-paper-item> container
    const paperItem = document.createElement('tp-yt-paper-item');
    paperItem.classList.add('style-scope', 'ytd-menu-service-item-renderer');
    paperItem.setAttribute('role', 'option');
    paperItem.setAttribute('tabindex', '0');
    paperItem.setAttribute('aria-disabled', 'false');

    // Create the yt-icon container with the exact structure and attributes
    const blocklistIconContainer = document.createElement('yt-icon-2');
    blocklistIconContainer.classList.add('style-scope', 'ytd-menu-service-item-renderer');
    blocklistIconContainer.style.marginRight = '16px';

    const iconShape = document.createElement('span');
    iconShape.classList.add('yt-icon-shape', 'yt-spec-icon-shape');

    const iconDiv = document.createElement('div');
    iconDiv.style.width = '100%';
    iconDiv.style.height = '100%';
    iconDiv.style.display = 'block';
    iconDiv.style.fill = 'currentcolor';

    // Create the img for the icon
    const imgElement = document.createElement('img');
    imgElement.src = <string>imgContextMenuIcon;
    imgElement.setAttribute('height', '24');
    imgElement.setAttribute('viewBox', '0 0 24 24');
    imgElement.setAttribute('width', '24');
    imgElement.setAttribute('focusable', 'false');
    imgElement.setAttribute('aria-hidden', 'true');
    imgElement.style.pointerEvents = 'none';
    imgElement.style.display = 'inherit';
    imgElement.style.width = '100%';
    imgElement.style.height = '100%';

    // Append SVG to div
    iconDiv.appendChild(imgElement);

    // Append the div to the icon shape
    iconShape.appendChild(iconDiv);

    // Force styles to ensure the icon is visible
    blocklistIconContainer.style.width = '24px';
    blocklistIconContainer.style.height = '24px';

    // Append the icon shape to the yt-icon container
    blocklistIconContainer.appendChild(iconShape);

    // Create the text for the menu item
    const blocklistText = document.createElement('yt-formatted-string-2');
    blocklistText.style.fontSize = '1.4rem';
    blocklistText.classList.add('style-scope', 'ytd-menu-service-item-renderer');
    blocklistText.textContent = 'Add to Blocklist';

    // Append the icon and text into <tp-yt-paper-item>
    paperItem.appendChild(blocklistIconContainer);
    paperItem.appendChild(blocklistText);

    // Append the <tp-yt-paper-item> into <ytd-menu-service-item-renderer>
    blocklistItem.appendChild(paperItem);

    // Style adjustments to ensure proper visibility (optional)
    blocklistItem.style.display = 'flex'; // Ensure it behaves like other items

    // Insert the new item above the "Report" item
    reportMenuItem.parentElement?.insertBefore(blocklistItem, reportMenuItem);

    const that = this;
    // Optional: Add click event listener to handle blocking action
    blocklistItem.addEventListener('click', () => {
      // Perform block action here
      if (that.clickedVideo) {
        console.log('Added to Blocklist');
        that.callbackAddToBlacklistClick(that.clickedVideo);
      }
      document.body.click();
    });
  };

  private removeBlocklistMenuItem = (): void => {
    // Look for the "Add to Blocklist" menu item by the text or some unique identifier
    const blocklistMenuItem: Element | null = document.querySelector('.scopsee-custom-context-button');

    // If the item exists, remove it along with its event listeners
    if (blocklistMenuItem) {
      blocklistMenuItem.remove(); // This removes the item and its event listeners
    }
  };

  /**
   * Handles DOM mutations, filtering and detecting video changes.
   */
  private onMutation() {
    const newVideos = this.queryVideosBasedOnUrl();
    const newShorts = this.queryShortsBasedOnUrl();
    const newPlaylists = this.queryPlaylistBasedOnUrl();

    const combinedArray = [...newVideos, ...newShorts, ...newPlaylists];

    const prioritizeVideoTypes = (arr: typeExtensionVideoData[]) => {
      const priorityMap = { video: 1, short: 2, playlist: 3 };

      const groupedById = arr.reduce((acc, curr) => {
        const { videoId } = curr;

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        if (!acc[videoId]) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          acc[videoId] = [];
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        acc[videoId].push(curr);
        return acc;
      }, {});

      return Object.values(groupedById).map(group => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        return group.sort((a, b) => priorityMap[a.videoType] - priorityMap[b.videoType])[0];
      });
    };

    const filteredArray = prioritizeVideoTypes(combinedArray.filter(vid => vid.videoId && vid.videoType));

    this.handleVideoChanges(filteredArray);
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
      const newShorts = this.queryShortsBasedOnUrl();
      this.handleVideoChanges([...newVideos, ...newShorts]);
    }, 2000); // Adjust this delay if needed
  }

  /**
   * Handles detected video changes, triggering the callback if new videos are found.
   */
  private handleVideoChanges(newVideos: typeExtensionVideoData[]) {
    this.detectedVideos = newVideos;
    const newVideoIds = new Set(newVideos.map(video => video.videoId));
    if (!this.areSetsEqual(this.previousVideoIds, newVideoIds)) {
      this.previousVideoIds = newVideoIds;
      this.callbackDetectedVideoFeeds(newVideos, this.currentUrl);
    }
  }

  /**
   * Queries playlist based on the current URL, distinguishing between homepage, sidebar, and search results.
   */
  private queryPlaylistBasedOnUrl(): typeExtensionVideoData[] {
    const url = window.location.href;

    if (url.includes('watch')) {
      return this.querySidebarPlaylist();
    } else if (url.includes('results')) {
      return this.querySearchPlaylist();
    } else {
      //return this.queryHomepagePlaylist();
    }
    return [];
  }

  /**
   * Queries videos based on the current URL, distinguishing between homepage, sidebar, and search results.
   */
  private queryVideosBasedOnUrl(): typeExtensionVideoData[] {
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
   * Queries videos based on the current URL, distinguishing between homepage, sidebar, and search results.
   */
  private queryShortsBasedOnUrl(): typeExtensionVideoData[] {
    const url = window.location.href;

    if (url.includes('watch')) {
      return this.querySidebarShorts();
    } else if (url.includes('results')) {
      return [...this.querySearchShorts(), ...this.querySearchShorts2()];
    } else {
      return this.queryHomepageShorts();
    }
  }
  /**
   * Queries and fetches sidebar playlist from the YouTube watch view.
   */
  private querySidebarPlaylist(): typeExtensionVideoData[] {
    return this.queryPlaylist(
      ['ytd-compact-radio-renderer'],
      'ytd-channel-name',
      'yt-image',
      'ytd-playlist-video-thumbnail-renderer',
      'div#metadata-line',
      'a.yt-simple-endpoint',
      'sidebar',
    );
  }

  /**
   * Queries and fetches playlist from the YouTube homepage.
   */
  private queryHomepagePlaylist(): typeExtensionVideoData[] {
    return this.queryPlaylist(
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
   * Queries and fetches playlist from YouTube search results.
   */
  private querySearchPlaylist(): typeExtensionVideoData[] {
    return this.queryPlaylist(
      ['ytd-radio-renderer', 'ytd-playlist-renderer'],
      'ytd-channel-name',
      'ytd-playlist-video-thumbnail-renderer',
      ['yt-image img', 'a.ytd-thumbnail'],
      'div#metadata-line',
      'a#thumbnail',
      'search',
    );
  }
  /**
   * Queries and fetches homePage shorts from the YouTube watch view.
   */
  private queryHomepageShorts(): typeExtensionVideoData[] {
    return this.queryShorts({
      containerSelector: 'ytd-rich-item-renderer',
      anchorSelector: 'div.image-overlay-text h3 a',
      titleSelector: '.image-overlay-text span[role="text"]',
      channelSelector: 'ytd-channel-name',
      type: 'homepage',
    });
  }

  /**
   * Queries and fetches sidebar shorts from the YouTube watch view.
   */
  private querySidebarShorts(): typeExtensionVideoData[] {
    return this.queryShorts({
      containerSelector: 'ytm-shorts-lockup-view-model-v2.ShortsLockupViewModelHost',
      anchorSelector: 'a.reel-item-endpoint',
      titleSelector: '.image-overlay-text h3 span[role="text"]',
      channelSelector: 'ytd-channel-name',
      type: 'sidebar',
    });
  }

  /**
   * Queries and fetches sharch shorts from the YouTube watch view.
   */
  private querySearchShorts(): typeExtensionVideoData[] {
    return this.queryShorts({
      containerSelector: 'ytm-shorts-lockup-view-model-v2.ShortsLockupViewModelHost',
      anchorSelector: 'a.reel-item-endpoint',
      titleSelector: '.image-overlay-text span[role="text"]',
      channelSelector: 'ytd-channel-name',
      type: 'search',
    });
  }
  private querySearchShorts2(): typeExtensionVideoData[] {
    return this.queryShorts({
      containerSelector: 'ytd-video-renderer',
      anchorSelector: 'a#video-title',
      titleSelector: 'yt-formatted-string',
      channelSelector: 'ytd-channel-name',
      type: 'search',
    });
  }

  /**
   * Queries and fetches sidebar videos from the YouTube watch view.
   */
  private querySidebarVideos(): typeExtensionVideoData[] {
    return this.queryVideos(
      'ytd-compact-video-renderer',
      'ytd-channel-name',
      'yt-image',
      'ytd-playlist-video-thumbnail-renderer',
      'div#metadata-line',
      'a.ytd-compact-video-renderer',
      'sidebar',
    );
  }

  /**
   * Queries and fetches videos from the YouTube homepage.
   */
  private queryHomepageVideos(): typeExtensionVideoData[] {
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
  private querySearchVideos(): typeExtensionVideoData[] {
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
   * Generalized playlist query function that works for different YouTube sections.
   */
  private queryPlaylist(
    containerSelectors: string | string[],
    channelSelector: string,
    playlistSelector: string,
    thumbNailSelector: string | string[],
    metadataSelector: string,
    anchorSelector: string,
    type: typeExtensionVideoData['type'],
  ): typeExtensionVideoData[] {
    const videoRenderers = document.querySelectorAll(
      typeof containerSelectors === 'string' ? containerSelectors : containerSelectors.join(', '),
    );
    const videoIdRegex = /\/watch\?v=([a-zA-Z0-9_-]{11})/;

    return Array.from(videoRenderers)
      .map(renderer => {
        const anchor = renderer.querySelector(anchorSelector) as HTMLAnchorElement | null;
        const href = anchor?.href ?? '';
        const videoIdMatch = href.match(videoIdRegex);

        if (videoIdMatch) {
          const videoId = videoIdMatch[1];
          const title = this.extractTitleFromPlaylist(renderer, type);

          // Handle thumbnail extraction
          let thumbnail = '';
          const thumbnailSelectors = Array.isArray(thumbNailSelector) ? thumbNailSelector : [thumbNailSelector];

          for (const selector of thumbnailSelectors) {
            const thumbnailElement = renderer.querySelector(selector) as HTMLImageElement | null;
            if (thumbnailElement) {
              if (selector.endsWith('img') || selector.includes('img.')) {
                thumbnail = thumbnailElement.src;
              } else {
                thumbnail = this.extractThumbnail(thumbnailElement);
              }
              break; // Stop at the first valid thumbnail found
            }
          }

          if (!thumbnail) {
            thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
          }

          const channel = this.extractChannelTitle(renderer.querySelector(channelSelector)).trim() || null;
          const channelId =
            this.extractChannelId(renderer.querySelector(channelSelector))?.replace(/^\/@/, '').trim() || null;
          const views = this.extractViews(renderer.querySelector(metadataSelector));

          const videoType = 'playlist';

          const videoData: typeExtensionVideoData = {
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
        } else {
          console.log('ESCAPE => ', renderer);
        }
        return null;
      })
      .filter(item => item !== null) as typeExtensionVideoData[];
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
    type: typeExtensionVideoData['type'],
  ): typeExtensionVideoData[] {
    const videoRenderers = document.querySelectorAll(containerSelector);
    const videoIdRegex = /\/watch\?v=([a-zA-Z0-9_-]{11})/;

    return Array.from(videoRenderers)
      .map(renderer => {
        const anchor = renderer.querySelector(anchorSelector) as HTMLAnchorElement | null;
        const href = anchor?.href ?? '';
        const videoIdMatch = href.match(videoIdRegex);

        if (videoIdMatch) {
          const videoId = videoIdMatch[1];
          const title = this.extractTitleFromVideo(anchor);
          // Handle thumbnail extraction
          let thumbnail = '';
          const thumbnailSelectors = Array.isArray(thumbNailSelector) ? thumbNailSelector : [thumbNailSelector];

          for (const selector of thumbnailSelectors) {
            const thumbnailElement = renderer.querySelector(selector) as HTMLImageElement | null;
            if (thumbnailElement) {
              if (selector.endsWith('img') || selector.includes('img.')) {
                thumbnail = thumbnailElement.src;
              } else {
                thumbnail = this.extractThumbnail(thumbnailElement);
              }
              break; // Stop at the first valid thumbnail found
            }
          }

          if (!thumbnail) {
            thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
          }

          const channel = this.extractChannelTitle(renderer.querySelector(channelSelector)).trim() || null;
          const channelId =
            this.extractChannelId(renderer.querySelector(channelSelector))?.replace(/^\/@/, '').trim() || null;
          const views = this.extractViews(renderer.querySelector(metadataSelector));

          const videoType = this.isPlaylist(renderer.querySelector(playlistSelector)) ? 'playlist' : 'video';

          const videoData: typeExtensionVideoData = {
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
      .filter(item => item !== null) as typeExtensionVideoData[];
  }

  /**
   * Generalized shorts query function that works for different YouTube sections.
   */
  private queryShorts(payload: {
    containerSelector: string;
    titleSelector: string;
    channelSelector: string;
    anchorSelector: string;
    type: 'homepage' | 'sidebar' | 'search';
  }): typeExtensionVideoData[] {
    const { containerSelector, titleSelector, channelSelector, anchorSelector, type } = payload;
    const videoRenderers = document.querySelectorAll(containerSelector);
    const videoIdRegex = /\/shorts\/([a-zA-Z0-9_-]{11})/;
    return Array.from(videoRenderers)
      .map(renderer => {
        const domAnchor = renderer.querySelector(anchorSelector) as HTMLAnchorElement | null;
        const domImageOverlayText = renderer.querySelector('.image-overlay-text');

        const href = domAnchor?.href ?? '';
        const videoIdMatch = href.match(videoIdRegex);

        if (domAnchor && videoIdMatch) {
          const videoId: string = videoIdMatch[1];

          let title: string = '';
          switch (type) {
            case 'homepage':
              title = domAnchor.querySelector(titleSelector)?.textContent?.trim() || '';
              break;
            case 'sidebar':
              title = renderer.querySelector(titleSelector)?.textContent?.trim() || '';
              break;
            case 'search':
              title = renderer.querySelector(titleSelector)?.textContent?.trim() || '';
              break;
          }
          const channel = this.extractChannelTitle(renderer.querySelector(channelSelector)) ?? null;
          const channelId = this.extractChannelId(renderer.querySelector(channelSelector)) ?? null;

          const viewsXPath: string =
            './/div[contains(@class, "ShortsLockupViewModelHostMetadataSubhead")]//span[@role="text"]';
          let domViews = null;
          if (domImageOverlayText) {
            domViews = document.evaluate(
              viewsXPath,
              domImageOverlayText as Node,
              null,
              XPathResult.FIRST_ORDERED_NODE_TYPE,
              null,
            ).singleNodeValue;
          }
          const views = domViews?.textContent?.replace(' views', '').trim() ?? '';
          // const views = this.extractViews(renderer.querySelector(metadataSelector));
          const videoType = 'shorts';

          if (title) {
            const videoData: typeExtensionVideoData = {
              videoId,
              title,
              thumbnail: `https://i.ytimg.com/vi/${videoId}/oar2.jpg`,
              videoType,
              channel,
              channelId: channelId ? channelId.replace('/@', '') : channelId,
              views,
              referenceDom: renderer as HTMLElement,
              type,
            };

            videoData.referenceDom.classList.add('detected-video');
            return videoData;
          }
        }
        return null;
      })
      .filter(item => item !== null) as typeExtensionVideoData[];
  }
  /**
   * Extracts the title from video through an anchor element.
   */
  private extractTitleFromVideo(anchor: Element | null): string {
    if (!anchor) return '';
    return anchor.getAttribute('title')?.trim() || anchor.querySelector('span#video-title')?.textContent?.trim() || '';
  }

  /**
   * Extracts the title from playlist.
   */
  private extractTitleFromPlaylist(dom: Element | null, type: typeExtensionVideoData['type']): string {
    if (!dom) return '';
    return dom.querySelector('span#video-title')?.textContent?.trim() || '';
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
    const newShorts = this.queryShortsBasedOnUrl();
    this.handleVideoChanges([...newVideos, ...newShorts]);
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
