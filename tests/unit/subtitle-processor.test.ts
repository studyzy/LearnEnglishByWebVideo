import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  processSubtitleWithTranslations, 
  identifyUnknownWords, 
  buildEnhancedHTML,
  applyTranslations
} from '../../src/background/subtitle-processor';
import type { SubtitleSegment, UserProfile, WordAnalysis } from '../../src/types/index';

// Mock dependencies
vi.mock('../../src/background/llm-service', () => ({
  translateWords: vi.fn(),
}));

vi.mock('../../src/lib/word-difficulty', () => ({
  isUnknownWord: vi.fn(),
  getDifficultyLevel: vi.fn(),
}));

vi.mock('../../src/lib/lemmatizer', () => ({
  lemmatizeWord: vi.fn((word) => word.toLowerCase()),
}));

import { translateWords } from '../../src/background/llm-service';
import { isUnknownWord } from '../../src/lib/word-difficulty';

describe('Subtitle Processor', () => {
  const mockProfile: UserProfile = {
    englishLevel: 'intermediate',
    llmProvider: 'openai',
    llmApiKey: 'test-key',
    masteredWords: [],
    focusWords: [],
    isEnabled: true,
    showOnboardingGuide: false,
    createdAt: Date.now(),
    lastUsedAt: Date.now(),
    subtitleFontSize: 16,
    subtitleFontColor: '#ffffff',
    subtitleBackgroundColor: 'rgba(0,0,0,0.8)',
    translationColor: '#00ff00',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('identifyUnknownWords', () => {
    it('should return unknown words with context', () => {
      const words: WordAnalysis[] = [
        { 
          word: 'Hello', 
          lemma: 'hello', 
          isUnknown: false, 
          position: { start: 0, end: 5 },
          difficulty: 'beginner' 
        },
        { 
          word: 'world', 
          lemma: 'world', 
          isUnknown: true, 
          position: { start: 6, end: 11 },
          difficulty: 'intermediate' 
        },
      ];
      const context = 'Hello world';
      
      const result = identifyUnknownWords(words, context);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        word: 'world',
        lemma: 'world',
        context: 'Hello world',
      });
    });
  });

  describe('buildEnhancedHTML', () => {
    it('should wrap unknown words with translations in spans', () => {
      const segment: SubtitleSegment = {
        startTime: 0,
        endTime: 5,
        originalText: 'Hello world',
        words: [
          { 
            word: 'Hello', 
            lemma: 'hello', 
            isUnknown: false, 
            position: { start: 0, end: 5 },
            difficulty: 'beginner' 
          },
          { 
            word: 'world', 
            lemma: 'world', 
            isUnknown: true, 
            translation: '世界',
            position: { start: 6, end: 11 },
            difficulty: 'intermediate' 
          },
        ],
        enhancedHTML: '',
      };
      
      const html = buildEnhancedHTML(segment);
      
      expect(html).toContain('Hello ');
      expect(html).toContain('<span class="yse-unknown-word" data-word="world">world<sup class="yse-translation">世界</sup></span>');
    });
  });

  describe('processSubtitleWithTranslations', () => {
    it('should process segments and get translations', async () => {
      const segments: SubtitleSegment[] = [
        {
          startTime: 0,
          endTime: 5,
          originalText: 'Unknown word',
          words: [],
          enhancedHTML: '',
        }
      ];

      // Mock word analysis
      (isUnknownWord as any).mockImplementation((word: string) => word === 'Unknown');
      
      // Mock translations
      const mockTranslations = new Map([['unknown', '未知的']]);
      (translateWords as any).mockResolvedValue(mockTranslations);

      const result = await processSubtitleWithTranslations(segments, mockProfile);

      expect(result).toHaveLength(1);
      expect(result[0].enhancedHTML).toContain('<sup class="yse-translation">未知的</sup>');
      expect(result[0].enhancedHTML).toContain('Unknown');
      expect(translateWords).toHaveBeenCalled();
    });

    it('should handle segments with no unknown words', async () => {
      const segments: SubtitleSegment[] = [
        {
          startTime: 0,
          endTime: 5,
          originalText: 'Known text',
          words: [],
          enhancedHTML: '',
        }
      ];

      (isUnknownWord as any).mockReturnValue(false);

      const result = await processSubtitleWithTranslations(segments, mockProfile);

      expect(result).toHaveLength(1);
      expect(result[0].enhancedHTML).toBe('Known text');
      expect(translateWords).not.toHaveBeenCalled();
    });
  });
});
