/**
 * YouTube Subtitle Extractor - Final Solution
 * 
 * Uses player manipulation and request interception to get subtitles.
 * This is the working solution that bypasses the incomplete baseUrl problem.
 * 
 * @module content/youtube-subtitle-extractor-final
 * @author YouTube Subtitle Enhancer Team
 * @since 0.3.0
 */

import type { SubtitleSegment } from '../types/index';

/**
 * JSON3 subtitle format from YouTube
 */
interface JSON3Event {
  tStartMs?: number;
  dDurationMs?: number;
  segs?: Array<{
    utf8?: string;
    tOffsetMs?: number;
  }>;
}

interface JSON3Response {
  wireMagic?: string;
  events?: JSON3Event[];
  pens?: any[];
  wsWinStyles?: any[];
  wpWinPositions?: any[];
}

/**
 * Extract subtitles by manipulating the YouTube player
 * This method intercepts the actual subtitle requests made by the player
 */
export async function extractSubtitlesViaPlayer(videoId: string): Promise<SubtitleSegment[]> {
  console.log('=== Extracting subtitles via player manipulation ===');
  console.log('Video ID:', videoId);
  
  return new Promise((resolve, reject) => {
    let capturedData: string | null = null;
    let timeoutId: NodeJS.Timeout;
    
    // Setup interceptors
    const originalFetch = window.fetch;
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    
    // Cleanup function
    const cleanup = () => {
      window.fetch = originalFetch;
      XMLHttpRequest.prototype.open = originalXHROpen;
      XMLHttpRequest.prototype.send = originalXHRSend;
      if (timeoutId) clearTimeout(timeoutId);
    };
    
    // Intercept Fetch requests
    window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
      const url = (typeof input === 'string') ? input : (input as Request).url;
      
      if (url && url.includes('/api/timedtext')) {
        console.log('✓ Captured timedtext request (fetch):', url.substring(0, 100));
        
        const response = await originalFetch.apply(this, arguments as any);
        const clone = response.clone();
        
        try {
          const text = await clone.text();
          if (text && text.length > 0) {
            console.log('✓ Got subtitle data from fetch:', text.length, 'bytes');
            capturedData = text;
            
            // Process immediately
            cleanup();
            
            try {
              const segments = parseJSON3Subtitle(text);
              resolve(segments);
            } catch (parseError) {
              reject(new Error(`Failed to parse subtitle data: ${parseError}`));
            }
          }
        } catch (error) {
          console.error('Failed to read fetch response:', error);
        }
        
        return response;
      }
      
      return originalFetch.apply(this, arguments as any);
    };
    
    // Intercept XHR requests (backup)
    XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...args: any[]) {
      (this as any)._url = url.toString();
      return originalXHROpen.apply(this, [method, url, ...args] as any);
    };
    
    XMLHttpRequest.prototype.send = function(body?: Document | XMLHttpRequestBodyInit | null) {
      this.addEventListener('load', function() {
        const url = (this as any)._url;
        if (url && url.includes('/api/timedtext')) {
          console.log('✓ Captured timedtext request (XHR):', url.substring(0, 100));
          
          if (this.responseText && this.responseText.length > 0) {
            console.log('✓ Got subtitle data from XHR:', this.responseText.length, 'bytes');
            capturedData = this.responseText;
            
            // Process immediately
            cleanup();
            
            try {
              const segments = parseJSON3Subtitle(this.responseText);
              resolve(segments);
            } catch (parseError) {
              reject(new Error(`Failed to parse subtitle data: ${parseError}`));
            }
          }
        }
      });
      
      return originalXHRSend.apply(this, [body] as any);
    };
    
    console.log('✓ Network interceptors installed');
    
    // Get player object
    const player = document.getElementById('movie_player') as any;
    if (!player) {
      cleanup();
      reject(new Error('Player not found (movie_player element)'));
      return;
    }
    
    console.log('✓ Found player object');
    
    // Get available tracks
    let tracks: any[] = [];
    try {
      tracks = player.getOption('captions', 'tracklist') || [];
      console.log(`Found ${tracks.length} caption tracks`);
    } catch (error) {
      console.error('Failed to get track list:', error);
      cleanup();
      reject(new Error('Failed to get caption track list from player'));
      return;
    }
    
    if (tracks.length === 0) {
      cleanup();
      reject(new Error('No caption tracks available for this video'));
      return;
    }
    
    // Find English track (prefer manual over auto-generated)
    let targetTrack = tracks.find(t => t.languageCode === 'en' && !t.kind);
    if (!targetTrack) {
      targetTrack = tracks.find(t => t.languageCode === 'en');
    }
    if (!targetTrack) {
      targetTrack = tracks.find(t => t.languageCode?.startsWith('en'));
    }
    if (!targetTrack) {
      targetTrack = tracks[0]; // Fallback to first track
    }
    
    const trackName = targetTrack.name?.simpleText || targetTrack.languageCode || 'Unknown';
    console.log(`Selected track: ${trackName} (${targetTrack.languageCode})`);
    
    // Set timeout to prevent hanging
    timeoutId = setTimeout(() => {
      if (!capturedData) {
        cleanup();
        reject(new Error('Timeout: Failed to capture subtitle data within 10 seconds'));
      }
    }, 10000);
    
    // Trigger subtitle loading by manipulating player
    (async () => {
      try {
        // Step 1: Disable captions
        console.log('Disabling captions...');
        player.setOption('captions', 'track', {});
        
        // Wait for state to reset
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Step 2: Enable target track
        console.log('Enabling target track...');
        player.setOption('captions', 'track', targetTrack);
        
        // Step 3: Load captions module if available
        if (player.loadModule) {
          player.loadModule('captions');
        }
        
        console.log('✓ Triggered subtitle loading, waiting for interception...');
        
      } catch (error) {
        cleanup();
        reject(new Error(`Failed to manipulate player: ${error}`));
      }
    })();
  });
}

/**
 * Parse JSON3 format subtitle data
 */
function parseJSON3Subtitle(jsonData: string): SubtitleSegment[] {
  console.log('Parsing JSON3 subtitle data...');
  
  try {
    const data: JSON3Response = JSON.parse(jsonData);
    
    if (!data.events || !Array.isArray(data.events)) {
      throw new Error('Invalid JSON3 format: missing events array');
    }
    
    console.log(`Found ${data.events.length} events`);
    
    const segments: SubtitleSegment[] = [];
    
    for (const event of data.events) {
      // Skip events without text
      if (!event.segs || event.segs.length === 0) {
        continue;
      }
      
      const startTime = (event.tStartMs || 0) / 1000; // Convert to seconds
      const duration = (event.dDurationMs || 0) / 1000;
      const endTime = startTime + duration;
      
      // Combine text segments
      const text = event.segs
        .map(seg => seg.utf8 || '')
        .join('')
        .trim();
      
      if (!text) {
        continue;
      }
      
      segments.push({
        startTime,
        endTime,
        originalText: text,
        enhancedHTML: '', // Will be filled by processor
        words: [], // Will be filled by processor
      });
    }
    
    console.log(`✓ Parsed ${segments.length} subtitle segments`);
    
    if (segments.length > 0) {
      console.log('Sample segments:');
      segments.slice(0, 3).forEach((seg, i) => {
        console.log(`  [${i}] ${seg.startTime.toFixed(2)}s: "${seg.originalText.substring(0, 50)}..."`);
      });
    }
    
    return segments;
    
  } catch (error) {
    console.error('Failed to parse JSON3 subtitle:', error);
    throw new Error(`JSON3 parsing failed: ${error}`);
  }
}

/**
 * Check if player is ready and has captions available
 */
export function isPlayerReady(): boolean {
  const player = document.getElementById('movie_player') as any;
  if (!player) {
    return false;
  }
  
  try {
    const tracks = player.getOption('captions', 'tracklist');
    return tracks && tracks.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Get available caption languages
 */
export function getAvailableLanguages(): string[] {
  const player = document.getElementById('movie_player') as any;
  if (!player) {
    return [];
  }
  
  try {
    const tracks = player.getOption('captions', 'tracklist') || [];
    return tracks.map((t: any) => t.languageCode).filter(Boolean);
  } catch (error) {
    return [];
  }
}
