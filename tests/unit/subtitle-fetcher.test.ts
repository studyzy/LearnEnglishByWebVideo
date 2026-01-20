/**
 * Unit Tests for Subtitle Fetcher Service
 * 
 * Tests YouTube subtitle parsing
 * 
 * @author YouTube Subtitle Enhancer Team
 * @since 0.4.0
 */

import { describe, it, expect } from 'vitest';
import { parseJSON3Format } from '../../src/background/subtitle-fetcher';

describe('Subtitle Fetcher Service', () => {
  describe('parseJSON3Format', () => {
    it('should parse valid JSON3 subtitle data', () => {
      const json3Data = JSON.stringify({
        events: [
          {
            tStartMs: 0,
            dDurationMs: 3000,
            segs: [{ utf8: 'Hello ' }, { utf8: 'world' }],
          },
          {
            tStartMs: 3000,
            dDurationMs: 2500,
            segs: [{ utf8: 'Welcome to YouTube' }],
          },
        ],
      });

      const segments = parseJSON3Format(json3Data);

      expect(segments).toHaveLength(2);
      expect(segments[0]).toEqual({
        startTime: 0,
        endTime: 3,
        originalText: 'Hello world',
        enhancedHTML: '',
        words: [],
      });
      expect(segments[1]).toEqual({
        startTime: 3,
        endTime: 5.5,
        originalText: 'Welcome to YouTube',
        enhancedHTML: '',
        words: [],
      });
    });

    it('should skip empty segments', () => {
      const json3Data = JSON.stringify({
        events: [
          {
            tStartMs: 0,
            dDurationMs: 3000,
            segs: [{ utf8: 'Hello' }],
          },
          {
            tStartMs: 3000,
            dDurationMs: 2000,
            segs: [],
          },
          {
            tStartMs: 5000,
            dDurationMs: 2000,
            segs: [{ utf8: 'World' }],
          },
        ],
      });

      const segments = parseJSON3Format(json3Data);

      expect(segments).toHaveLength(2);
      expect(segments[0].originalText).toBe('Hello');
      expect(segments[1].originalText).toBe('World');
    });

    it('should throw error on invalid JSON', () => {
      const invalidJson = 'not valid json';
      
      expect(() => parseJSON3Format(invalidJson)).toThrow('JSON3 parsing failed');
    });

    it('should throw error on missing events array', () => {
      const json3Data = JSON.stringify({ noEvents: true });
      
      expect(() => parseJSON3Format(json3Data)).toThrow('Invalid JSON3 format: missing events array');
    });
  });
});
