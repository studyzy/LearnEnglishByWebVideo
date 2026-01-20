/**
 * Subtitle Fetcher Service
 * 
 * Handles parsing YouTube subtitles from the Timedtext API data.
 * The raw data is now captured via main world interception.
 * 
 * @module background/subtitle-fetcher
 * @author YouTube Subtitle Enhancer Team
 * @since 0.4.0
 */

import type { SubtitleSegment } from '../types/index';

/**
 * YouTube JSON3 subtitle format response
 */
interface JSON3SubtitleResponse {
  events?: Array<{
    tStartMs?: number;
    dDurationMs?: number;
    segs?: Array<{
      utf8?: string;
      tOffsetMs?: number;
    }>;
  }>;
}

/**
 * Parses YouTube JSON3 format subtitle data into SubtitleSegment array
 * 
 * @param json3Data - Raw JSON3 format subtitle data
 * @returns Array of parsed subtitle segments
 */
export function parseJSON3Format(json3Data: string): SubtitleSegment[] {
  try {
    const parsed: JSON3SubtitleResponse = JSON.parse(json3Data);
    
    if (!parsed.events || !Array.isArray(parsed.events)) {
      throw new Error('Invalid JSON3 format: missing events array');
    }
    
    const segments: SubtitleSegment[] = [];
    
    for (const event of parsed.events) {
      if (!event.segs || event.segs.length === 0) continue;
      
      const startTime = (event.tStartMs ?? 0) / 1000;
      const duration = (event.dDurationMs ?? 0) / 1000;
      const endTime = startTime + duration;
      
      const originalText = event.segs
        .map(seg => seg.utf8 || '')
        .join('')
        .trim();
      
      if (!originalText) continue;
      
      segments.push({
        startTime,
        endTime,
        originalText,
        enhancedHTML: '', 
        words: [],
      });
    }
    
    console.log(`[YSE] Parsed ${segments.length} subtitle segments`);
    return segments;
  } catch (error) {
    console.error('[YSE] Failed to parse JSON3 format:', error);
    throw new Error(`JSON3 parsing failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
