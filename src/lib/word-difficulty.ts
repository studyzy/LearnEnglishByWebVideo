/**
 * Word Difficulty Service
 * 
 * This module determines whether a word is unknown to the user based on:
 * - User's English proficiency level (beginner/intermediate/advanced)
 * - User's mastered words list
 * - COCA word frequency dictionaries
 * 
 * @author YouTube Subtitle Enhancer Team
 * @since 0.1.0
 */

import { isBeginnerWord } from '../assets/dictionaries/beginner-words';
import { isIntermediateWord } from '../assets/dictionaries/intermediate-words';
import { isAdvancedWord } from '../assets/dictionaries/advanced-words';
import type { UserProfile } from '../types/index';

/**
 * Difficulty level enum
 */
export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert', // Words beyond advanced level (10000+)
}

/**
 * Determine the difficulty level of a word
 * 
 * @param word - Word to evaluate (will be converted to lowercase)
 * @returns Difficulty level of the word
 */
export function getDifficultyLevel(word: string): DifficultyLevel {
  const normalizedWord = word.toLowerCase();

  // Check dictionaries in order of difficulty
  if (isBeginnerWord(normalizedWord)) {
    return DifficultyLevel.BEGINNER;
  }

  if (isIntermediateWord(normalizedWord)) {
    return DifficultyLevel.INTERMEDIATE;
  }

  if (isAdvancedWord(normalizedWord)) {
    return DifficultyLevel.ADVANCED;
  }

  // Words not in any dictionary are considered expert level
  return DifficultyLevel.EXPERT;
}

/**
 * Check if a word is unknown to the user based on their profile
 * 
 * A word is unknown if:
 * 1. It's above the user's English level, AND
 * 2. It's not in the user's mastered words list
 * 
 * @param word - Word to check
 * @param lemma - Optional lemma form for variation matching
 * @param profile - User profile containing English level and vocabulary lists
 * @returns True if the word is unknown and needs translation
 */
export function isUnknownWord(
  word: string,
  profile: UserProfile,
  lemma?: string,
): boolean {
  const normalizedWord = word.toLowerCase();
  const normalizedLemma = lemma?.toLowerCase();

  // 1. Check if word is in mastered list (including lemma variations)
  const isMastered = profile.masteredWords.some(
    (entry) =>
      entry.word === normalizedWord ||
      (normalizedLemma && entry.lemma === normalizedLemma) ||
      (entry.lemma && entry.lemma === normalizedWord),
  );

  if (isMastered) {
    return false; // User knows this word
  }

  // 2. Check if word is in focus list (treat as known for display purposes)
  const isFocused = profile.focusWords.some(
    (entry) =>
      entry.word === normalizedWord ||
      (normalizedLemma && entry.lemma === normalizedLemma) ||
      (entry.lemma && entry.lemma === normalizedWord),
  );

  if (isFocused) {
    return true; // User wants to focus on this word, so show translation
  }

  // 3. Check word difficulty against user's English level
  const difficulty = getDifficultyLevel(normalizedWord);

  switch (profile.englishLevel) {
    case 'beginner':
      // Beginner users need help with everything above beginner level
      return difficulty !== DifficultyLevel.BEGINNER;

    case 'intermediate':
      // Intermediate users need help with advanced and expert words
      return (
        difficulty === DifficultyLevel.ADVANCED || difficulty === DifficultyLevel.EXPERT
      );

    case 'advanced':
      // Advanced users only need help with expert level words
      return difficulty === DifficultyLevel.EXPERT;

    default:
      // Default to intermediate behavior
      return (
        difficulty === DifficultyLevel.ADVANCED || difficulty === DifficultyLevel.EXPERT
      );
  }
}

/**
 * Check if multiple words are unknown
 * Returns a map of word -> boolean for efficient lookup
 * 
 * @param words - Array of words to check
 * @param profile - User profile
 * @param lemmas - Optional map of word -> lemma
 * @returns Map of word -> isUnknown
 */
export function checkMultipleWords(
  words: string[],
  profile: UserProfile,
  lemmas?: Map<string, string>,
): Map<string, boolean> {
  const results = new Map<string, boolean>();

  for (const word of words) {
    const lemma = lemmas?.get(word);
    const unknown = isUnknownWord(word, profile, lemma);
    results.set(word, unknown);
  }

  return results;
}

/**
 * Get words that need translation from a text
 * Splits text into words and filters for unknown words
 * 
 * @param text - Text to analyze
 * @param profile - User profile
 * @param lemmas - Optional map of word -> lemma
 * @returns Array of unknown words that need translation
 */
export function getUnknownWordsFromText(
  text: string,
  profile: UserProfile,
  lemmas?: Map<string, string>,
): string[] {
  // Split text into words (simple tokenization)
  // Remove punctuation and convert to lowercase
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
    .split(/\s+/)
    .filter((word) => word.length > 0);

  // Remove duplicates
  const uniqueWords = Array.from(new Set(words));

  // Filter for unknown words
  return uniqueWords.filter((word) => {
    const lemma = lemmas?.get(word);
    return isUnknownWord(word, profile, lemma);
  });
}

/**
 * Get statistics about a text's difficulty
 * 
 * @param text - Text to analyze
 * @param profile - User profile
 * @returns Statistics object with word counts by difficulty
 */
export function getTextDifficultyStats(
  text: string,
  profile: UserProfile,
): {
  totalWords: number;
  uniqueWords: number;
  unknownWords: number;
  knownWords: number;
  unknownPercentage: number;
  difficultyBreakdown: Record<DifficultyLevel, number>;
} {
  // Tokenize text
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 0);

  const totalWords = words.length;
  const uniqueWords = Array.from(new Set(words));

  // Count unknown words
  let unknownCount = 0;
  const difficultyBreakdown: Record<DifficultyLevel, number> = {
    [DifficultyLevel.BEGINNER]: 0,
    [DifficultyLevel.INTERMEDIATE]: 0,
    [DifficultyLevel.ADVANCED]: 0,
    [DifficultyLevel.EXPERT]: 0,
  };

  for (const word of uniqueWords) {
    const difficulty = getDifficultyLevel(word);
    difficultyBreakdown[difficulty]++;

    if (isUnknownWord(word, profile)) {
      unknownCount++;
    }
  }

  const knownCount = uniqueWords.length - unknownCount;
  const unknownPercentage = totalWords > 0 ? (unknownCount / uniqueWords.length) * 100 : 0;

  return {
    totalWords,
    uniqueWords: uniqueWords.length,
    unknownWords: unknownCount,
    knownWords: knownCount,
    unknownPercentage,
    difficultyBreakdown,
  };
}

/**
 * Recommend appropriate English level based on text difficulty
 * 
 * @param text - Text sample
 * @returns Recommended English level
 */
export function recommendEnglishLevel(text: string): 'beginner' | 'intermediate' | 'advanced' {
  // Tokenize text
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 0);

  const uniqueWords = Array.from(new Set(words));

  // Count words by difficulty
  let beginnerCount = 0;
  let intermediateCount = 0;
  let advancedCount = 0;
  let expertCount = 0;

  for (const word of uniqueWords) {
    const difficulty = getDifficultyLevel(word);
    switch (difficulty) {
      case DifficultyLevel.BEGINNER:
        beginnerCount++;
        break;
      case DifficultyLevel.INTERMEDIATE:
        intermediateCount++;
        break;
      case DifficultyLevel.ADVANCED:
        advancedCount++;
        break;
      case DifficultyLevel.EXPERT:
        expertCount++;
        break;
    }
  }

  // Calculate percentages
  const total = uniqueWords.length;
  const beginnerPct = (beginnerCount / total) * 100;
  const intermediatePct = ((beginnerCount + intermediateCount) / total) * 100;
  // advancedPct represents cumulative coverage of all known words
  // const advancedPct = ((beginnerCount + intermediateCount + advancedCount) / total) * 100;

  // Recommend level based on coverage
  // If >90% covered by beginner words, recommend beginner
  // If >85% covered by intermediate words, recommend intermediate
  // Otherwise recommend advanced
  if (beginnerPct > 90) {
    return 'beginner';
  } else if (intermediatePct > 85) {
    return 'intermediate';
  } else {
    return 'advanced';
  }
}
