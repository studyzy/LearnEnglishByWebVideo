/**
 * Word Difficulty Service Unit Tests
 * 
 * Tests for word difficulty determination and unknown word detection
 * 
 * @author YouTube Subtitle Enhancer Team
 * @since 0.1.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getDifficultyLevel,
  isUnknownWord,
  checkMultipleWords,
  getUnknownWordsFromText,
  getTextDifficultyStats,
  recommendEnglishLevel,
  DifficultyLevel,
} from '../../src/lib/word-difficulty';
import { createMockUserProfile } from '../setup';
import type { UserProfile } from '../../src/types/index';

describe('Word Difficulty Service - Difficulty Level', () => {
  it('should identify beginner level words', () => {
    expect(getDifficultyLevel('the')).toBe(DifficultyLevel.BEGINNER);
    expect(getDifficultyLevel('hello')).toBe(DifficultyLevel.BEGINNER);
    expect(getDifficultyLevel('good')).toBe(DifficultyLevel.BEGINNER);
  });

  it('should identify intermediate level words', () => {
    expect(getDifficultyLevel('analyze')).toBe(DifficultyLevel.INTERMEDIATE);
    expect(getDifficultyLevel('computer')).toBe(DifficultyLevel.INTERMEDIATE);
  });

  it('should identify advanced level words', () => {
    expect(getDifficultyLevel('abandon')).toBe(DifficultyLevel.ADVANCED);
    expect(getDifficultyLevel('elaborate')).toBe(DifficultyLevel.ADVANCED);
  });

  it('should identify expert level words (not in any dictionary)', () => {
    expect(getDifficultyLevel('supercalifragilisticexpialidocious')).toBe(
      DifficultyLevel.EXPERT,
    );
    expect(getDifficultyLevel('xyzabc123')).toBe(DifficultyLevel.EXPERT);
  });

  it('should be case-insensitive', () => {
    expect(getDifficultyLevel('HELLO')).toBe(DifficultyLevel.BEGINNER);
    expect(getDifficultyLevel('Hello')).toBe(DifficultyLevel.BEGINNER);
    expect(getDifficultyLevel('hello')).toBe(DifficultyLevel.BEGINNER);
  });
});

describe('Word Difficulty Service - Unknown Word Detection', () => {
  let beginnerProfile: UserProfile;
  let intermediateProfile: UserProfile;
  let advancedProfile: UserProfile;

  beforeEach(() => {
    beginnerProfile = createMockUserProfile({
      englishLevel: 'beginner',
      masteredWords: [],
    });

    intermediateProfile = createMockUserProfile({
      englishLevel: 'intermediate',
      masteredWords: [],
    });

    advancedProfile = createMockUserProfile({
      englishLevel: 'advanced',
      masteredWords: [],
    });
  });

  it('should detect unknown words for beginner users', () => {
    // Beginner words should be known
    expect(isUnknownWord('hello', beginnerProfile)).toBe(false);
    expect(isUnknownWord('good', beginnerProfile)).toBe(false);

    // Intermediate and above should be unknown
    expect(isUnknownWord('analyze', beginnerProfile)).toBe(true);
    expect(isUnknownWord('abandon', beginnerProfile)).toBe(true);
  });

  it('should detect unknown words for intermediate users', () => {
    // Beginner and intermediate words should be known
    expect(isUnknownWord('hello', intermediateProfile)).toBe(false);
    expect(isUnknownWord('analyze', intermediateProfile)).toBe(false);

    // Advanced and expert should be unknown
    expect(isUnknownWord('abandon', intermediateProfile)).toBe(true);
    expect(isUnknownWord('xyz123', intermediateProfile)).toBe(true);
  });

  it('should detect unknown words for advanced users', () => {
    // Beginner, intermediate, and advanced words should be known
    expect(isUnknownWord('hello', advancedProfile)).toBe(false);
    expect(isUnknownWord('analyze', advancedProfile)).toBe(false);
    expect(isUnknownWord('abandon', advancedProfile)).toBe(false);

    // Only expert level should be unknown
    expect(isUnknownWord('xyz123', advancedProfile)).toBe(true);
  });

  it('should respect mastered words list', () => {
    const profile = createMockUserProfile({
      englishLevel: 'beginner',
      masteredWords: [
        { word: 'analyze', lemma: 'analyze', addedTime: Date.now(), source: 'manual' },
      ],
    });

    // Even though "analyze" is intermediate, user has mastered it
    expect(isUnknownWord('analyze', profile)).toBe(false);
  });

  it('should match lemma variations', () => {
    const profile = createMockUserProfile({
      englishLevel: 'beginner',
      masteredWords: [
        { word: 'run', lemma: 'run', addedTime: Date.now(), source: 'manual' },
      ],
    });

    // "running" with lemma "run" should match mastered "run"
    expect(isUnknownWord('running', profile, 'run')).toBe(false);
    expect(isUnknownWord('ran', profile, 'run')).toBe(false);
    expect(isUnknownWord('runs', profile, 'run')).toBe(false);
  });

  it('should treat focus words as unknown (to show translation)', () => {
    const profile = createMockUserProfile({
      englishLevel: 'advanced',
      focusWords: [
        { word: 'hello', lemma: 'hello', addedTime: Date.now(), source: 'manual' },
      ],
    });

    // Even though "hello" is beginner and user is advanced, focus words should be marked unknown
    expect(isUnknownWord('hello', profile)).toBe(true);
  });
});

describe('Word Difficulty Service - Batch Operations', () => {
  it('should check multiple words efficiently', () => {
    const profile = createMockUserProfile({
      englishLevel: 'intermediate',
      masteredWords: [],
    });

    const words = ['hello', 'analyze', 'abandon', 'xyz123'];
    const results = checkMultipleWords(words, profile);

    expect(results.get('hello')).toBe(false); // Beginner - known
    expect(results.get('analyze')).toBe(false); // Intermediate - known
    expect(results.get('abandon')).toBe(true); // Advanced - unknown
    expect(results.get('xyz123')).toBe(true); // Expert - unknown
  });

  it('should extract unknown words from text', () => {
    const profile = createMockUserProfile({
      englishLevel: 'beginner',
      masteredWords: [],
    });

    const text = 'Hello, I want to analyze this elaborate document.';
    const unknownWords = getUnknownWordsFromText(text, profile);

    // "hello", "i", "want", "to", "this" are beginner words
    // "analyze", "elaborate", "document" are higher level
    expect(unknownWords).toContain('analyze');
    expect(unknownWords).toContain('elaborate');
    expect(unknownWords).toContain('document');
    expect(unknownWords).not.toContain('hello');
    expect(unknownWords).not.toContain('want');
  });

  it('should handle punctuation in text', () => {
    const profile = createMockUserProfile({
      englishLevel: 'intermediate',
      masteredWords: [],
    });

    const text = "Hello, world! Let's analyze this.";
    const unknownWords = getUnknownWordsFromText(text, profile);

    // Should extract clean words without punctuation
    expect(unknownWords.some((w) => w.includes(','))).toBe(false);
    expect(unknownWords.some((w) => w.includes('!'))).toBe(false);
    expect(unknownWords.some((w) => w.includes("'"))).toBe(false);
  });
});

describe('Word Difficulty Service - Text Statistics', () => {
  it('should calculate text difficulty statistics', () => {
    const profile = createMockUserProfile({
      englishLevel: 'intermediate',
      masteredWords: [],
    });

    const text = 'Hello world. I want to analyze this elaborate document carefully.';
    const stats = getTextDifficultyStats(text, profile);

    expect(stats.totalWords).toBeGreaterThan(0);
    expect(stats.uniqueWords).toBeGreaterThan(0);
    expect(stats.unknownWords).toBeGreaterThan(0);
    expect(stats.knownWords).toBeGreaterThan(0);
    expect(stats.unknownPercentage).toBeGreaterThanOrEqual(0);
    expect(stats.unknownPercentage).toBeLessThanOrEqual(100);
  });

  it('should provide difficulty breakdown', () => {
    const profile = createMockUserProfile({
      englishLevel: 'intermediate',
      masteredWords: [],
    });

    const text = 'Hello world analyze abandon xyz123';
    const stats = getTextDifficultyStats(text, profile);

    expect(stats.difficultyBreakdown[DifficultyLevel.BEGINNER]).toBeGreaterThan(0);
    expect(stats.difficultyBreakdown[DifficultyLevel.INTERMEDIATE]).toBeGreaterThan(0);
    expect(stats.difficultyBreakdown[DifficultyLevel.ADVANCED]).toBeGreaterThan(0);
    expect(stats.difficultyBreakdown[DifficultyLevel.EXPERT]).toBeGreaterThan(0);
  });

  it('should handle empty text', () => {
    const profile = createMockUserProfile({
      englishLevel: 'intermediate',
      masteredWords: [],
    });

    const stats = getTextDifficultyStats('', profile);

    expect(stats.totalWords).toBe(0);
    expect(stats.uniqueWords).toBe(0);
    expect(stats.unknownWords).toBe(0);
    expect(stats.unknownPercentage).toBe(0);
  });
});

describe('Word Difficulty Service - Level Recommendation', () => {
  it('should recommend beginner for simple text', () => {
    const text = 'Hello. I am good. You are nice. We want food.';
    const level = recommendEnglishLevel(text);

    expect(level).toBe('beginner');
  });

  it('should recommend intermediate for moderate text', () => {
    const text =
      'Hello, I want to analyze this document and understand the computer system.';
    const level = recommendEnglishLevel(text);

    // Should be intermediate since it has some intermediate words mixed with beginner
    expect(level).toBe('intermediate');
  });

  it('should recommend advanced for complex text', () => {
    const text =
      'The elaborate architecture necessitates comprehensive analysis of the intricate mechanisms.';
    const level = recommendEnglishLevel(text);

    // Should be advanced due to advanced vocabulary
    expect(level).toBe('advanced');
  });

  it('should handle mixed difficulty text appropriately', () => {
    const text = 'Hello world. Computer analyze. Elaborate abandon.';
    const level = recommendEnglishLevel(text);

    // Mixed text with beginner, intermediate, and advanced words
    // Should recommend based on coverage percentages
    expect(['beginner', 'intermediate', 'advanced']).toContain(level);
  });
});
