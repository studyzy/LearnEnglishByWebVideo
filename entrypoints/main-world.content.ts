/**
 * Main World Content Script
 * 
 * This script runs in the main page context (window) and handles:
 * - Intercepting network requests (fetch/XHR) to capture subtitles
 * - Accessing YouTube's internal player API (movie_player)
 * - Communicating with the isolated world content script
 * 
 * @module content/main-world
 * @author YouTube Subtitle Enhancer Team
 * @since 0.4.0
 */

export default defineContentScript({
  matches: ['*://www.youtube.com/watch*'],
  world: 'MAIN',
  runAt: 'document_start',

  main() {
    console.log('YouTube Subtitle Enhancer: Main world script loaded');

    // --- 1. Network Interception ---
    const originalFetch = window.fetch;
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;

    // Intercept Fetch
    window.fetch = async function (input, init) {
      const url = typeof input === 'string' ? input : (input as Request).url;
      if (url && url.includes('/api/timedtext')) {
        console.debug('[YSE] Captured fetch timedtext:', url);
        const response = await originalFetch.apply(this, arguments as any);
        const clone = response.clone();
        clone.text().then(text => {
          if (text) {
            window.dispatchEvent(new CustomEvent('YSE_SUBTITLE_CAPTURED', { detail: text }));
          }
        }).catch(err => console.error('[YSE] Failed to read fetch body', err));
        return response;
      }
      return originalFetch.apply(this, arguments as any);
    };

    // Intercept XHR
    XMLHttpRequest.prototype.open = function (method, url) {
      (this as any)._url = url.toString();
      return originalXHROpen.apply(this, arguments as any);
    };

    XMLHttpRequest.prototype.send = function (body) {
      this.addEventListener('load', function () {
        const url = (this as any)._url;
        if (url && url.includes('/api/timedtext')) {
          console.debug('[YSE] Captured XHR timedtext:', url);
          if (this.responseText) {
            window.dispatchEvent(new CustomEvent('YSE_SUBTITLE_CAPTURED', { detail: this.responseText }));
          }
        }
      });
      return originalXHRSend.apply(this, arguments as any);
    };

    // --- 2. Player Manipulation ---
    window.addEventListener('YSE_TRIGGER_CAPTURE', async (event: any) => {
      console.log('[YSE-Main] Received trigger to capture subtitles');
      const player = document.getElementById('movie_player') as any;
      if (!player) {
        console.error('[YSE] Player not found');
        return;
      }

      try {
        const tracks = player.getOption('captions', 'tracklist') || [];
        if (tracks.length === 0) {
          console.warn('[YSE] No caption tracks found');
          return;
        }

        // Send tracks back to isolated world
        console.log('[YSE-Main] Found caption tracks:', tracks.length);
        window.dispatchEvent(new CustomEvent('YSE_TRACKS_FOUND', { detail: tracks }));

        // Find target track (prefer English)
        let targetTrack = tracks.find((t: any) => t.languageCode === 'en' && !t.kind);
        if (!targetTrack) targetTrack = tracks.find((t: any) => t.languageCode === 'en');
        if (!targetTrack) targetTrack = tracks[0];

        console.debug('[YSE] Toggling track to force download:', targetTrack.name?.simpleText);

        // Force reload by toggling
        player.setOption('captions', 'track', {});
        await new Promise(r => setTimeout(r, 500));
        player.setOption('captions', 'track', targetTrack);
        
        if (player.loadModule) {
          player.loadModule('captions');
        }
      } catch (err) {
        console.error('[YSE] Error manipulating player', err);
      }
    });

    console.log('YouTube Subtitle Enhancer: Interceptors ready');
  },
});
