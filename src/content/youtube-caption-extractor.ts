/**
 * YouTube Caption Extractor
 * 
 * Extracts captions directly from YouTube's caption module on the page
 * This is the most reliable method as it uses the same data YouTube displays
 * 
 * @author YouTube Subtitle Enhancer Team
 * @since 0.1.0
 */

import type { SubtitleSegment } from '../types/index';

/**
 * Extracts the params parameter from transcript button
 * This is needed for the get_transcript API
 */
function extractTranscriptParams(): string | null {
  try {
    // Find the transcript button in the menu
    const menuItems = document.querySelectorAll('ytd-menu-service-item-renderer');
    for (const item of menuItems) {
      const button = item.querySelector('button, a');
      if (button?.textContent?.toLowerCase().includes('transcript') ||
          button?.textContent?.toLowerCase().includes('显示文稿') ||
          button?.textContent?.toLowerCase().includes('show transcript')) {
        
        // Extract the service endpoint
        const renderer = (item as any).__data?.data;
        const endpoint = renderer?.menuServiceItemRenderer?.serviceEndpoint;
        const params = endpoint?.getTranscriptEndpoint?.params;
        
        if (params) {
          console.log('Found transcript params:', params);
          return params;
        }
      }
    }
    
    console.warn('Could not find transcript params from menu');
    return null;
  } catch (error) {
    console.error('Failed to extract transcript params:', error);
    return null;
  }
}

/**
 * Clicks the transcript button to make YouTube load the transcript panel
 */
async function openTranscriptPanel(): Promise<boolean> {
  try {
    console.log('Attempting to open transcript panel...');
    
    // Find and click the "..." menu button
    const moreButton = document.querySelector('button[aria-label*="More"], button[aria-label*="更多"]');
    if (!moreButton) {
      console.warn('Could not find more button');
      return false;
    }
    
    (moreButton as HTMLElement).click();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Find and click the transcript button
    const menuItems = document.querySelectorAll('ytd-menu-service-item-renderer');
    for (const item of menuItems) {
      const text = item.textContent?.toLowerCase() || '';
      if (text.includes('transcript') || text.includes('显示文稿') || text.includes('文字')) {
        const button = item.querySelector('button, a') as HTMLElement;
        if (button) {
          console.log('Clicking transcript button...');
          button.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
          return true;
        }
      }
    }
    
    console.warn('Could not find transcript button in menu');
    return false;
  } catch (error) {
    console.error('Failed to open transcript panel:', error);
    return false;
  }
}

/**
 * Extracts transcript data from the opened transcript panel
 */
function extractTranscriptFromPanel(): SubtitleSegment[] | null {
  try {
    console.log('Extracting transcript from panel...');
    
    // Find the transcript panel
    const panel = document.querySelector('ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-searchable-transcript"]');
    if (!panel) {
      console.warn('Transcript panel not found');
      return null;
    }
    
    // Find all transcript segments
    const segmentElements = panel.querySelectorAll('ytd-transcript-segment-renderer');
    console.log('Found segment elements:', segmentElements.length);
    
    if (segmentElements.length === 0) {
      return null;
    }
    
    const segments: SubtitleSegment[] = [];
    
    for (const element of segmentElements) {
      try {
        // Extract timestamp
        const timestampEl = element.querySelector('.segment-timestamp');
        const timestampText = timestampEl?.textContent?.trim() || '0:00';
        const startTime = parseTimestamp(timestampText);
        
        // Extract text
        const textEl = element.querySelector('.segment-text');
        const text = textEl?.textContent?.trim() || '';
        
        if (text) {
          segments.push({
            startTime,
            endTime: startTime + 5, // Approximate, will be refined
            originalText: text,
            enhancedHTML: '',
            words: [],
          });
        }
      } catch (err) {
        console.warn('Failed to parse segment:', err);
      }
    }
    
    // Refine end times based on next segment's start time
    for (let i = 0; i < segments.length - 1; i++) {
      segments[i]!.endTime = segments[i + 1]!.startTime;
    }
    
    console.log(`Extracted ${segments.length} segments from panel`);
    return segments;
  } catch (error) {
    console.error('Failed to extract from panel:', error);
    return null;
  }
}

/**
 * Parses timestamp string like "1:23" or "1:23:45" to seconds
 */
function parseTimestamp(timestamp: string): number {
  const parts = timestamp.split(':').map(p => parseInt(p, 10));
  
  if (parts.length === 2) {
    // MM:SS
    return parts[0]! * 60 + parts[1]!;
  } else if (parts.length === 3) {
    // HH:MM:SS
    return parts[0]! * 3600 + parts[1]! * 60 + parts[2]!;
  }
  
  return 0;
}

/**
 * Closes the transcript panel to clean up
 */
function closeTranscriptPanel(): void {
  try {
    const closeButton = document.querySelector('#panel-title button[aria-label*="Close"], #panel-title button[aria-label*="关闭"]');
    if (closeButton) {
      (closeButton as HTMLElement).click();
    }
  } catch (error) {
    console.warn('Failed to close transcript panel:', error);
  }
}

/**
 * Main function: Extract captions by opening the transcript panel
 * This is a reliable fallback method when API methods fail
 */
export async function extractCaptionsViaPanel(videoId: string): Promise<SubtitleSegment[]> {
  console.log('=== Extracting captions via transcript panel ===');
  
  try {
    // 1. Open the transcript panel
    const opened = await openTranscriptPanel();
    if (!opened) {
      throw new Error('Could not open transcript panel');
    }
    
    // 2. Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 3. Extract the transcript data
    const segments = extractTranscriptFromPanel();
    if (!segments || segments.length === 0) {
      throw new Error('No segments found in panel');
    }
    
    console.log(`✓ Successfully extracted ${segments.length} segments via panel`);
    
    // 4. Close the panel
    closeTranscriptPanel();
    
    return segments;
  } catch (error) {
    console.error('Panel extraction failed:', error);
    
    // Try to close panel anyway
    closeTranscriptPanel();
    
    throw error;
  }
}

/**
 * Alternative: Use YouTube's internal player data
 * Some videos have caption data embedded in ytInitialPlayerResponse
 */
export function extractCaptionsFromPlayerData(videoId: string): SubtitleSegment[] | null {
  try {
    const win = window as any;
    const playerResponse = win.ytInitialPlayerResponse;
    
    if (!playerResponse) {
      return null;
    }
    
    // Check if there's embedded caption data
    // (This is rare, but worth trying)
    const captions = playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    
    // This won't have the actual text, but we've already tried this
    // Just return null for now
    return null;
  } catch (error) {
    console.error('Failed to extract from player data:', error);
    return null;
  }
}
