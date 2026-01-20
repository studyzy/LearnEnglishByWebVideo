/**
 * Vocabulary Service
 * 
 * Provides vocabulary identification and management services based on user's English level.
 * Identifies unknown words by checking against difficulty level dictionaries and user's
 * mastered words list.
 * 
 * @module background/vocabulary-service
 * @author YouTube Subtitle Enhancer Team
 * @since 0.1.0
 */

import type { UserProfile, WordEntry } from '../types/index';
import { isUnknownWord, getDifficultyLevel } from '../lib/word-difficulty';
import { lemmatizeWord } from '../lib/lemmatizer';

/**
 * Word identification result
 */
export interface WordIdentificationResult {
  /** Original word */
  word: string;
  /** Lemma (root form) */
  lemma: string;
  /** Whether the word is unknown to the user */
  isUnknown: boolean;
  /** Difficulty level of the word */
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

/**
 * Vocabulary Service Class
 * 
 * Manages vocabulary identification based on user's English level and mastered words.
 */
export class VocabularyService {
  private profile: UserProfile;
  
  constructor(profile: UserProfile) {
    this.profile = profile;
  }
  
  /**
   * Update user profile
   */
  updateProfile(profile: UserProfile): void {
    this.profile = profile;
  }
  
  /**
   * Identify unknown words from a list of words
   * 
   * @param words - Array of words to check
   * @returns Array of identification results
   * 
   * @example
   * ```typescript
   * const service = new VocabularyService(profile);
   * const results = service.identifyUnknownWords(['running', 'sophisticated', 'cat']);
   * // Returns identification results for each word
   * ```
   */
  identifyUnknownWords(words: string[]): WordIdentificationResult[] {
    const results: WordIdentificationResult[] = [];
    const seen = new Set<string>(); // Avoid duplicates
    
    for (const word of words) {
      // Normalize word
      const normalized = word.toLowerCase().trim();
      if (!normalized || seen.has(normalized)) {
        continue;
      }
      
      seen.add(normalized);
      
      // Get lemma
      const lemma = lemmatizeWord(normalized);
      
      // Check if unknown (pass lemma for proper checking against mastered words)
      const unknown = isUnknownWord(normalized, this.profile, lemma);
      
      // Get difficulty level
      const difficulty = getDifficultyLevel(normalized);
      
      results.push({
        word: normalized,
        lemma,
        isUnknown: unknown,
        difficulty,
      });
    }
    
    return results;
  }
  
  /**
   * Check if a specific word is unknown
   * 
   * @param word - Word to check
   * @returns True if word is unknown, false otherwise
   */
  isWordUnknown(word: string): boolean {
    const normalized = word.toLowerCase().trim();
    const lemma = lemmatizeWord(normalized);
    return isUnknownWord(normalized, this.profile, lemma);
  }
  
  /**
   * Get difficulty level for a word
   * 
   * @param word - Word to check
   * @returns Difficulty level or undefined if not in dictionary
   */
  getWordDifficulty(word: string): 'beginner' | 'intermediate' | 'advanced' | 'expert' | undefined {
    const normalized = word.toLowerCase().trim();
    return getDifficultyLevel(normalized);
  }
  
  /**
   * Check if user has mastered a word (by checking lemma)
   * 
   * @param word - Word to check
   * @returns True if word is in mastered list
   */
  isMastered(word: string): boolean {
    const normalized = word.toLowerCase().trim();
    const lemma = lemmatizeWord(normalized);
    
    return this.profile.masteredWords.some(entry => {
      return entry.word === normalized || entry.lemma === lemma;
    });
  }
  
  /**
   * Get statistics about user's vocabulary level
   * 
   * @returns Vocabulary statistics
   */
  getVocabularyStats(): {
    masteredCount: number;
    focusCount: number;
    englishLevel: string;
    estimatedVocabularySize: number;
  } {
    let estimatedSize = 0;
    
    switch (this.profile.englishLevel) {
      case 'beginner':
        estimatedSize = 3000;
        break;
      case 'intermediate':
        estimatedSize = 6000;
        break;
      case 'advanced':
        estimatedSize = 10000;
        break;
    }
    
    return {
      masteredCount: this.profile.masteredWords.length,
      focusCount: this.profile.focusWords.length,
      englishLevel: this.profile.englishLevel,
      estimatedVocabularySize: estimatedSize + this.profile.masteredWords.length,
    };
  }
  
  /**
   * Filter words to only unknown ones
   * 
   * @param words - Array of words to filter
   * @returns Array of unknown words only
   */
  filterUnknownWords(words: string[]): string[] {
    return words.filter(word => this.isWordUnknown(word));
  }
  
  /**
   * Group words by difficulty level
   * 
   * @param words - Array of words to group
   * @returns Object with words grouped by difficulty
   */
  groupByDifficulty(words: string[]): {
    beginner: string[];
    intermediate: string[];
    advanced: string[];
    expert: string[];
    unknown: string[];
  } {
    const grouped = {
      beginner: [] as string[],
      intermediate: [] as string[],
      advanced: [] as string[],
      expert: [] as string[],
      unknown: [] as string[],
    };
    
    for (const word of words) {
      const difficulty = this.getWordDifficulty(word);
      if (difficulty) {
        grouped[difficulty].push(word);
      } else {
        grouped.unknown.push(word);
      }
    }
    
    return grouped;
  }
}

/**
 * Create vocabulary service instance for user profile
 * 
 * @param profile - User profile
 * @returns VocabularyService instance
 * 
 * @example
 * ```typescript
 * const service = createVocabularyService(profile);
 * const unknownWords = service.filterUnknownWords(['run', 'sophisticated']);
 * ```
 */
export function createVocabularyService(profile: UserProfile): VocabularyService {
  return new VocabularyService(profile);
}
