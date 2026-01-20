/**
 * Vocabulary Service Unit Tests
 * 
 * Tests for the vocabulary service module covering:
 * - Word identification based on English level
 * - Mastered words handling
 * - Focus words handling
 * - Difficulty level grouping
 * - Vocabulary statistics
 * - Lemmatization integration
 * 
 * @author YouTube Subtitle Enhancer Team
 * @since 0.1.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  VocabularyService,
  createVocabularyService,
} from '../../src/background/vocabulary-service';
import { createMockUserProfile } from '../setup';
import type { UserProfile, WordEntry } from '../../src/types/index';

describe('Vocabulary Service - Basic Functionality', () => {
  let service: VocabularyService;
  let profile: UserProfile;

  beforeEach(() => {
    vi.clearAllMocks();
    profile = createMockUserProfile({
      englishLevel: 'intermediate',
      masteredWords: [],
      focusWords: [],
    }) as UserProfile;
    service = new VocabularyService(profile);
  });

  it('should create service with user profile', () => {
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(VocabularyService);
  });

  it('should update profile', () => {
    const newProfile = createMockUserProfile({
      englishLevel: 'advanced',
    }) as UserProfile;
    
    service.updateProfile(newProfile);
    const stats = service.getVocabularyStats();
    expect(stats.englishLevel).toBe('advanced');
  });

  it('should create service using factory function', () => {
    const factoryService = createVocabularyService(profile);
    expect(factoryService).toBeDefined();
    expect(factoryService).toBeInstanceOf(VocabularyService);
  });
});

describe('Vocabulary Service - Word Identification by Level', () => {
  describe('Beginner Level', () => {
    let service: VocabularyService;

    beforeEach(() => {
      const profile = createMockUserProfile({
        englishLevel: 'beginner',
        masteredWords: [],
        focusWords: [],
      }) as UserProfile;
      service = new VocabularyService(profile);
    });

    it('should identify beginner words as known', () => {
      const beginnerWords = ['cat', 'dog', 'run', 'the', 'a', 'hello'];
      const results = service.identifyUnknownWords(beginnerWords);
      
      const knownWords = results.filter(r => !r.isUnknown);
      expect(knownWords.length).toBeGreaterThan(0);
    });

    it('should identify advanced words as unknown', () => {
      const advancedWords = ['sophisticated', 'comprehensive', 'methodology'];
      const results = service.identifyUnknownWords(advancedWords);
      
      const unknownWords = results.filter(r => r.isUnknown);
      expect(unknownWords.length).toBeGreaterThan(0);
    });

    it('should filter to only unknown words', () => {
      const mixedWords = ['the', 'a', 'sophisticated', 'hello', 'comprehensive'];
      const unknownOnly = service.filterUnknownWords(mixedWords);
      
      // Should contain advanced words but not beginner words
      expect(unknownOnly).toContain('sophisticated');
      expect(unknownOnly).toContain('comprehensive');
      // Common beginner words should not be in unknown list
      expect(unknownOnly).not.toContain('the');
      expect(unknownOnly).not.toContain('a');
    });
  });

  describe('Intermediate Level', () => {
    let service: VocabularyService;

    beforeEach(() => {
      const profile = createMockUserProfile({
        englishLevel: 'intermediate',
        masteredWords: [],
        focusWords: [],
      }) as UserProfile;
      service = new VocabularyService(profile);
    });

    it('should identify beginner and intermediate words as known', () => {
      const words = ['cat', 'dog', 'understand', 'important', 'available'];
      const unknownWords = service.filterUnknownWords(words);
      
      // Intermediate users should know beginner and intermediate words
      expect(unknownWords.length).toBeLessThan(words.length);
    });

    it('should identify expert words as unknown', () => {
      const expertWords = ['epistemological', 'paradigmatic', 'heuristic'];
      const results = service.identifyUnknownWords(expertWords);
      
      // These should be marked as unknown for intermediate users
      const unknownCount = results.filter(r => r.isUnknown).length;
      expect(unknownCount).toBeGreaterThan(0);
    });
  });

  describe('Advanced Level', () => {
    let service: VocabularyService;

    beforeEach(() => {
      const profile = createMockUserProfile({
        englishLevel: 'advanced',
        masteredWords: [],
        focusWords: [],
      }) as UserProfile;
      service = new VocabularyService(profile);
    });

    it('should identify most words as known', () => {
      const words = ['cat', 'sophisticated', 'understand', 'methodology'];
      const unknownWords = service.filterUnknownWords(words);
      
      // Advanced users should know most words
      expect(unknownWords.length).toBeLessThan(words.length);
    });
  });
});

describe('Vocabulary Service - Mastered Words', () => {
  let service: VocabularyService;
  let profile: UserProfile;

  beforeEach(() => {
    profile = createMockUserProfile({
      englishLevel: 'beginner',
      masteredWords: [
        { word: 'sophisticated', lemma: 'sophisticated', addedAt: Date.now() },
        { word: 'run', lemma: 'run', addedAt: Date.now() },
      ] as WordEntry[],
      focusWords: [],
    }) as UserProfile;
    service = new VocabularyService(profile);
  });

  it('should treat mastered words as known regardless of level', () => {
    // 'sophisticated' is advanced but should be treated as known
    expect(service.isWordUnknown('sophisticated')).toBe(false);
  });

  it('should handle lemma forms of mastered words', () => {
    // 'running' has lemma 'run' which is in mastered list
    expect(service.isMastered('running')).toBe(true);
  });

  it('should not mark mastered words as unknown in results', () => {
    const words = ['sophisticated', 'run', 'methodology'];
    const results = service.identifyUnknownWords(words);
    
    const sophisticated = results.find(r => r.word === 'sophisticated');
    expect(sophisticated?.isUnknown).toBe(false);
    
    const run = results.find(r => r.word === 'run');
    expect(run?.isUnknown).toBe(false);
    
    // Note: 'running' would need lemma passed to isUnknownWord to be recognized
    // This is a known limitation that could be fixed in vocabulary-service.ts line 80
  });

  it('should include mastered words in vocabulary stats', () => {
    const stats = service.getVocabularyStats();
    expect(stats.masteredCount).toBe(2);
  });
});

describe('Vocabulary Service - Focus Words', () => {
  let service: VocabularyService;

  beforeEach(() => {
    const profile = createMockUserProfile({
      englishLevel: 'advanced',
      masteredWords: [],
      focusWords: [
        { word: 'cat', lemma: 'cat', addedAt: Date.now() },
        { word: 'dog', lemma: 'dog', addedAt: Date.now() },
      ] as WordEntry[],
    }) as UserProfile;
    service = new VocabularyService(profile);
  });

  it('should mark focus words as unknown even if user knows them', () => {
    // 'cat' and 'dog' are beginner words, but advanced user wants to focus on them
    expect(service.isWordUnknown('cat')).toBe(true);
    expect(service.isWordUnknown('dog')).toBe(true);
  });

  it('should include focus words in unknown words filter', () => {
    const words = ['cat', 'dog', 'hello'];
    const unknownWords = service.filterUnknownWords(words);
    
    // Should include cat and dog because they're in focus list
    expect(unknownWords).toContain('cat');
    expect(unknownWords).toContain('dog');
  });

  it('should include focus words count in stats', () => {
    const stats = service.getVocabularyStats();
    expect(stats.focusCount).toBe(2);
  });
});

describe('Vocabulary Service - Word Difficulty', () => {
  let service: VocabularyService;

  beforeEach(() => {
    const profile = createMockUserProfile({
      englishLevel: 'intermediate',
      masteredWords: [],
      focusWords: [],
    }) as UserProfile;
    service = new VocabularyService(profile);
  });

  it('should return difficulty level for dictionary words', () => {
    const difficulty = service.getWordDifficulty('cat');
    expect(difficulty).toBeDefined();
    expect(['beginner', 'intermediate', 'advanced', 'expert']).toContain(difficulty);
  });

  it('should return expert for words not in dictionary', () => {
    // Words not in dictionary default to expert level
    const difficulty = service.getWordDifficulty('xyzabc123notaword');
    expect(difficulty).toBe('expert');
  });

  it('should group words by difficulty level', () => {
    const words = ['cat', 'sophisticated', 'run', 'methodology', 'xyznotaword'];
    const grouped = service.groupByDifficulty(words);
    
    expect(grouped).toHaveProperty('beginner');
    expect(grouped).toHaveProperty('intermediate');
    expect(grouped).toHaveProperty('advanced');
    expect(grouped).toHaveProperty('expert');
    expect(grouped).toHaveProperty('unknown');
    
    // Should have some words in categories
    const totalWords = Object.values(grouped).reduce((sum, arr) => sum + arr.length, 0);
    expect(totalWords).toBe(words.length);
  });

  it('should place words not in dictionary as expert level', () => {
    // Words not in dictionary are classified as expert level
    const words = ['xyznotaword', 'abcnotaword'];
    const grouped = service.groupByDifficulty(words);
    
    expect(grouped.expert.length).toBeGreaterThan(0);
    expect(grouped.expert).toContain('xyznotaword');
    expect(grouped.expert).toContain('abcnotaword');
  });
});

describe('Vocabulary Service - Word Identification Results', () => {
  let service: VocabularyService;

  beforeEach(() => {
    const profile = createMockUserProfile({
      englishLevel: 'intermediate',
      masteredWords: [],
      focusWords: [],
    }) as UserProfile;
    service = new VocabularyService(profile);
  });

  it('should include lemma in identification results', () => {
    const words = ['running', 'cats', 'dogs'];
    const results = service.identifyUnknownWords(words);
    
    results.forEach(result => {
      expect(result).toHaveProperty('lemma');
      expect(result.lemma).toBeDefined();
    });
  });

  it('should normalize words to lowercase', () => {
    const words = ['Running', 'CATS', 'DoGs'];
    const results = service.identifyUnknownWords(words);
    
    results.forEach(result => {
      expect(result.word).toBe(result.word.toLowerCase());
    });
  });

  it('should remove duplicate words', () => {
    const words = ['cat', 'cat', 'dog', 'dog', 'cat'];
    const results = service.identifyUnknownWords(words);
    
    expect(results.length).toBe(2); // Only cat and dog
  });

  it('should skip empty or whitespace-only words', () => {
    const words = ['cat', '', '  ', 'dog', '\t\n'];
    const results = service.identifyUnknownWords(words);
    
    expect(results.length).toBe(2); // Only cat and dog
  });

  it('should include all required fields in results', () => {
    const words = ['cat'];
    const results = service.identifyUnknownWords(words);
    
    expect(results[0]).toHaveProperty('word');
    expect(results[0]).toHaveProperty('lemma');
    expect(results[0]).toHaveProperty('isUnknown');
    expect(results[0]).toHaveProperty('difficulty');
  });
});

describe('Vocabulary Service - Statistics', () => {
  it('should calculate correct stats for beginner', () => {
    const profile = createMockUserProfile({
      englishLevel: 'beginner',
      masteredWords: [
        { word: 'run', lemma: 'run', addedAt: Date.now() },
      ] as WordEntry[],
      focusWords: [
        { word: 'cat', lemma: 'cat', addedAt: Date.now() },
      ] as WordEntry[],
    }) as UserProfile;
    
    const service = new VocabularyService(profile);
    const stats = service.getVocabularyStats();
    
    expect(stats.masteredCount).toBe(1);
    expect(stats.focusCount).toBe(1);
    expect(stats.englishLevel).toBe('beginner');
    expect(stats.estimatedVocabularySize).toBe(3001); // 3000 base + 1 mastered
  });

  it('should calculate correct stats for intermediate', () => {
    const profile = createMockUserProfile({
      englishLevel: 'intermediate',
      masteredWords: [
        { word: 'word1', lemma: 'word1', addedAt: Date.now() },
        { word: 'word2', lemma: 'word2', addedAt: Date.now() },
      ] as WordEntry[],
      focusWords: [],
    }) as UserProfile;
    
    const service = new VocabularyService(profile);
    const stats = service.getVocabularyStats();
    
    expect(stats.masteredCount).toBe(2);
    expect(stats.englishLevel).toBe('intermediate');
    expect(stats.estimatedVocabularySize).toBe(6002); // 6000 base + 2 mastered
  });

  it('should calculate correct stats for advanced', () => {
    const profile = createMockUserProfile({
      englishLevel: 'advanced',
      masteredWords: [
        { word: 'word1', lemma: 'word1', addedAt: Date.now() },
        { word: 'word2', lemma: 'word2', addedAt: Date.now() },
        { word: 'word3', lemma: 'word3', addedAt: Date.now() },
      ] as WordEntry[],
      focusWords: [],
    }) as UserProfile;
    
    const service = new VocabularyService(profile);
    const stats = service.getVocabularyStats();
    
    expect(stats.masteredCount).toBe(3);
    expect(stats.englishLevel).toBe('advanced');
    expect(stats.estimatedVocabularySize).toBe(10003); // 10000 base + 3 mastered
  });
});
