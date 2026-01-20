/**
 * YouTube Transcript API
 * 
 * Alternative method to fetch YouTube subtitles using the internal transcript API
 * This bypasses the timedtext API restrictions
 * 
 * @author YouTube Subtitle Enhancer Team
 * @since 0.1.0
 */

import type { SubtitleSegment } from '../types/index';

/**
 * Fetches transcript using YouTube's internal get_transcript endpoint
 * This is more reliable than the timedtext API
 */
export async function fetchTranscriptAPI(videoId: string): Promise<SubtitleSegment[]> {
  try {
    console.log('Fetching transcript via internal API for video:', videoId);
    
    // Get the innertube API key from page
    const apiKey = extractInnertubeApiKey();
    if (!apiKey) {
      throw new Error('Could not find innertube API key');
    }
    
    console.log('Found API key:', apiKey.substring(0, 20) + '...');
    
    // Build the request
    const url = `https://www.youtube.com/youtubei/v1/get_transcript?key=${apiKey}`;
    
    const body = {
      context: {
        client: {
          clientName: 'WEB',
          clientVersion: '2.20250120.00.00',
        },
      },
      params: videoId, // Video ID as params
    };
    
    console.log('Fetching transcript from:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Referer': window.location.href,
        'Origin': 'https://www.youtube.com',
      },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Transcript API response:', data);
    
    // Parse the response
    const transcriptData = data?.actions?.[0]?.updateEngagementPanelAction?.content
      ?.transcriptRenderer?.content?.transcriptSearchPanelRenderer?.body
      ?.transcriptSegmentListRenderer?.initialSegments;
    
    if (!transcriptData || !Array.isArray(transcriptData)) {
      console.warn('No transcript data found in response');
      return [];
    }
    
    console.log('Found transcript segments:', transcriptData.length);
    
    // Convert to SubtitleSegment format
    const segments: SubtitleSegment[] = transcriptData.map((item: any) => {
      const segment = item.transcriptSegmentRenderer;
      const startMs = parseInt(segment.startMs, 10);
      const endMs = parseInt(segment.endMs || segment.startMs, 10);
      const text = segment.snippet?.runs?.map((r: any) => r.text).join('') || '';
      
      return {
        startTime: startMs / 1000,
        endTime: endMs / 1000,
        originalText: text,
        enhancedHTML: '',
        words: [],
      };
    });
    
    console.log('Converted to subtitle segments:', segments.length);
    return segments;
    
  } catch (error) {
    console.error('Failed to fetch transcript via API:', error);
    throw error;
  }
}

/**
 * Extracts the innertube API key from the YouTube page
 */
function extractInnertubeApiKey(): string | null {
  try {
    // Method 1: From ytcfg
    const win = window as any;
    if (win.ytcfg?.data_?.INNERTUBE_API_KEY) {
      return win.ytcfg.data_.INNERTUBE_API_KEY;
    }
    
    // Method 2: From script tags
    const scripts = document.querySelectorAll('script');
    for (const script of scripts) {
      const content = script.textContent || '';
      const match = content.match(/"INNERTUBE_API_KEY":"([^"]+)"/);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    // Method 3: Common default key (may not work)
    return 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';
    
  } catch (error) {
    console.error('Failed to extract API key:', error);
    return null;
  }
}

/**
 * Alternative: Parse captions from the player's caption module
 * This monitors live captions as they appear
 */
export function setupLiveCaptionMonitor(callback: (text: string, timestamp: number) => void): () => void {
  console.log('Setting up live caption monitor...');
  
  let observer: MutationObserver | null = null;
  
  // Find the caption container
  const findCaptionContainer = () => {
    return document.querySelector('.ytp-caption-window-container') ||
           document.querySelector('.caption-window');
  };
  
  const startMonitoring = () => {
    const container = findCaptionContainer();
    if (!container) {
      console.warn('Caption container not found');
      return;
    }
    
    console.log('Found caption container, starting observer');
    
    observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          const captionText = container.textContent?.trim();
          if (captionText) {
            const video = document.querySelector<HTMLVideoElement>('video.html5-main-video');
            const timestamp = video?.currentTime || 0;
            callback(captionText, timestamp);
          }
        }
      }
    });
    
    observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  };
  
  // Try to start immediately, or wait for container
  const container = findCaptionContainer();
  if (container) {
    startMonitoring();
  } else {
    // Wait for container to appear
    const checkInterval = setInterval(() => {
      if (findCaptionContainer()) {
        clearInterval(checkInterval);
        startMonitoring();
      }
    }, 1000);
    
    // Stop checking after 10 seconds
    setTimeout(() => clearInterval(checkInterval), 10000);
  }
  
  // Return cleanup function
  return () => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  };
}
