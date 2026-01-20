/**
 * Lemmatizer Service
 * 
 * Provides word lemmatization (word form reduction) using the wink-lemmatizer library.
 * Reduces inflected words to their base/dictionary form (lemma).
 * 
 * Examples:
 * - running → run
 * - cats → cat  
 * - better → good
 * - was → be
 * 
 * @module lib/lemmatizer
 * @author YouTube Subtitle Enhancer Team
 * @since 0.1.0
 */

import lemmatizer from 'wink-lemmatizer';

/**
 * Lemmatizer Class
 * 
 * Handles word lemmatization with support for verbs, nouns, and adjectives.
 */
export class Lemmatizer {
  /**
   * Lemmatize a word to its base form
   * 
   * Tries lemmatization in this order:
   * 1. Verb (running → run)
   * 2. Noun (cats → cat)
   * 3. Adjective (better → good)
   * 
   * @param word - Word to lemmatize
   * @returns Lemmatized form of the word
   * 
   * @example
   * ```typescript
   * const lem = new Lemmatizer();
   * lem.lemmatize("running") // => "run"
   * lem.lemmatize("cats") // => "cat"
   * lem.lemmatize("better") // => "good"
   * ```
   */
  lemmatize(word: string): string {
    const lowerWord = word.toLowerCase();
    
    // Try verb lemmatization first
    const verb = lemmatizer.verb(lowerWord);
    if (verb !== lowerWord) {
      return verb;
    }
    
    // Try noun lemmatization
    const noun = lemmatizer.noun(lowerWord);
    if (noun !== lowerWord) {
      return noun;
    }
    
    // Try adjective lemmatization
    const adj = lemmatizer.adjective(lowerWord);
    if (adj !== lowerWord) {
      return adj;
    }
    
    // No lemmatization found, return lowercase form
    return lowerWord;
  }

  /**
   * Automatically lemmatize with best-guess part of speech
   * 
   * Alias for lemmatize() for backward compatibility.
   * 
   * @param word - Word to lemmatize
   * @returns Lemmatized form of the word
   */
  lemmatizeAuto(word: string): string {
    return this.lemmatize(word);
  }

  /**
   * Check if two words have the same lemma (base form)
   * 
   * Useful for comparing words regardless of inflection:
   * - run, runs, running, ran → all have lemma "run"
   * - cat, cats → both have lemma "cat"
   * 
   * @param word1 - First word
   * @param word2 - Second word
   * @returns True if both words have the same lemma
   * 
   * @example
   * ```typescript
   * const lem = new Lemmatizer();
   * lem.isSameLemma("run", "running") // => true
   * lem.isSameLemma("cat", "cats") // => true
   * lem.isSameLemma("run", "walk") // => false
   * ```
   */
  isSameLemma(word1: string, word2: string): boolean {
    return this.lemmatize(word1) === this.lemmatize(word2);
  }
}

/**
 * Singleton instance for convenience
 */
const lemm = new Lemmatizer();

/**
 * Lemmatize a word to its base form (convenience function)
 * 
 * @param word - Word to lemmatize
 * @returns Lemmatized form of the word
 * 
 * @example
 * ```typescript
 * lemmatizeWord("running") // => "run"
 * lemmatizeWord("better") // => "good"
 * lemmatizeWord("cats") // => "cat"
 * ```
 */
export function lemmatizeWord(word: string): string {
  return lemm.lemmatize(word);
}

/**
 * Check if two words have the same lemma
 * 
 * @param word1 - First word
 * @param word2 - Second word
 * @returns True if both words have the same lemma
 */
export function isSameLemma(word1: string, word2: string): boolean {
  return lemm.isSameLemma(word1, word2);
}

/**
 * Default export for class usage
 */
export default Lemmatizer;
