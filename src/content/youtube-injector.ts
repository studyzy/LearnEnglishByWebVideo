/**
 * YouTube Injector
 * 
 * Detects YouTube video player, extracts video information, and requests
 * subtitles by triggering the main world interceptor.
 * 
 * @module content/youtube-injector
 * @author YouTube Subtitle Enhancer Team
 * @since 0.4.0
 */

import type { SubtitleSegment } from '../types/index';
import { MessageType } from '../types/index';
import { sendToBackground } from '../lib/message-bridge';
import type { CaptionTrackInfo } from '../background/subtitle-fetcher';

/**
 * YouTube video player state
 */
export interface YouTubePlayerState {
  videoId: string;
  title: string;
  url: string;
  videoElement: HTMLVideoElement;
  selectedTrack?: CaptionTrackInfo;
}

let currentPlayerState: YouTubePlayerState | null = null;

/**
 * Detects the YouTube video player on the page
 */
export async function detectYouTubePlayer(timeout = 10000): Promise<HTMLVideoElement | null> {
  const existingVideo = document.querySelector<HTMLVideoElement>('video.html5-main-video');
  if (existingVideo) return existingVideo;

  return new Promise<HTMLVideoElement | null>((resolve) => {
    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      const video = document.querySelector<HTMLVideoElement>('video.html5-main-video');
      if (video) {
        clearInterval(checkInterval);
        resolve(video);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        resolve(null);
      }
    }, 100);
  });
}

/**
 * Extracts YouTube video ID from URL
 */
export function extractVideoId(url: string = window.location.href): string | null {
  try {
    const urlObj = new URL(url);
    if (urlObj.pathname === '/watch') {
      return urlObj.searchParams.get('v');
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Extracts video title from YouTube page
 */
export function extractVideoTitle(): string {
  const h1 = document.querySelector('h1.ytd-video-primary-info-renderer, #title h1');
  return h1?.textContent?.trim() || document.title.replace(' - YouTube', '');
}

/**
 * Initializes the YouTube player state
 */
export async function initializePlayer(): Promise<YouTubePlayerState | null> {
  const videoElement = await detectYouTubePlayer();
  const videoId = extractVideoId();
  if (!videoElement || !videoId) return null;

  currentPlayerState = {
    videoId,
    title: extractVideoTitle(),
    url: window.location.href,
    videoElement,
    // selectedTrack will be populated after tracks are found from main world
  };

  return currentPlayerState;
}

/**
 * Requests subtitles by triggering the main world interceptor and waiting for the data
 */
export async function requestSubtitles(
  videoId: string,
  _dummyTrack?: any // Kept for compatibility with existing caller
): Promise<SubtitleSegment[]> {
  console.log('[YSE] Requesting subtitles for:', videoId);

  return new Promise((resolve, reject) => {
    let captured = false;

    // 1. Listen for captured data from main world
    const captureListener = async (event: any) => {
      const rawData = event.detail;
      if (!rawData) return;
      
      console.log('[YSE] Subtitle data captured from main world');
      captured = true;
      window.removeEventListener('YSE_SUBTITLE_CAPTURED', captureListener);

      try {
        // Send to background for processing (translation, etc.)
        const response = await sendToBackground({
          type: MessageType.GET_SUBTITLE,
          videoId,
          captionTrack: { languageCode: 'en' }, // Dummy track info, background handles raw data
          rawSubtitleData: rawData,
        } as any);

        if (response.type === MessageType.SUBTITLE_RESPONSE) {
          resolve((response as any).session.segments);
        } else {
          reject(new Error('Background failed to process subtitles'));
        }
      } catch (err) {
        reject(err);
      }
    };

    window.addEventListener('YSE_SUBTITLE_CAPTURED', captureListener);

    // 2. Trigger capture in main world
    console.log('[YSE] Dispatching YSE_TRIGGER_CAPTURE event...');
    window.dispatchEvent(new CustomEvent('YSE_TRIGGER_CAPTURE'));

    // 3. Timeout fallback
    setTimeout(() => {
      if (!captured) {
        window.removeEventListener('YSE_SUBTITLE_CAPTURED', captureListener);
        reject(new Error('Subtitle capture timed out'));
      }
    }, 15000);
  });
}

export function isWatchPage(): boolean {
  return window.location.pathname === '/watch' && !!new URLSearchParams(window.location.search).get('v');
}

export function clearPlayerState(): void {
  currentPlayerState = null;
}

export function setupURLChangeDetection(callback: () => void): void {
  let lastUrl = window.location.href;
  const observer = new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      callback();
    }
  });
  const title = document.querySelector('title');
  if (title) observer.observe(title, { childList: true });
  window.addEventListener('yt-navigate-finish', callback);
}
