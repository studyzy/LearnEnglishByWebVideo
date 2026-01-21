/**
 * Subtitle Processor Service
 * 
 * Processes subtitle segments to identify unknown words and create enhanced HTML.
 * Integrates with word difficulty detection and LLM translation services.
 * 
 * @module background/subtitle-processor
 * @author YouTube Subtitle Enhancer Team
 * @since 0.1.0
 */

import type { SubtitleSegment, WordAnalysis, UserProfile } from '../types/index';
import { isUnknownWord, getDifficultyLevel } from '../lib/word-difficulty';
import { lemmatizeWord } from '../lib/lemmatizer';
import { translateWords, type TranslationRequest } from './llm-service';

/**
 * Word tokenization regex - matches words (including contractions and hyphenated words)
 */
const WORD_REGEX = /\b[\w'-]+\b/g;

/**
 * Extracts and analyzes words from subtitle text
 * 
 * @param text - Subtitle text to analyze
 * @param profile - User profile with English level and mastered words
 * @returns Array of word analysis results
 * 
 * @example
 * ```typescript
 * const words = analyzeWords("I'm running fast", profile);
 * // Returns: [{ word: "I'm", lemma: "i", isUnknown: false, ... }, ...]
 * ```
 */
export function analyzeWords(text: string, profile: UserProfile): WordAnalysis[] {
  const words: WordAnalysis[] = [];
  const matches = text.matchAll(WORD_REGEX);
  
  for (const match of matches) {
    const word = match[0];
    const position = {
      start: match.index || 0,
      end: (match.index || 0) + word.length,
    };
    
    // Get lemma (root form) of the word
    const lemma = lemmatizeWord(word);
    
    // Check if word is unknown to user
    const unknown = isUnknownWord(word, profile, lemma);
    
    // Get difficulty level
    const difficulty = getDifficultyLevel(word);
    
    words.push({
      word,
      lemma,
      isUnknown: unknown,
      position,
      difficulty,
    });
  }
  
  return words;
}

// Export lemmatizeWord for backward compatibility
// (Re-export from lib/lemmatizer)
export { lemmatizeWord } from '../lib/lemmatizer';

/**
 * Processes a subtitle segment to identify unknown words
 * 
 * This function:
 * 1. Tokenizes the subtitle text into words
 * 2. Lemmatizes each word
 * 3. Checks against user's mastered words and English level
 * 4. Returns word analysis results
 * 
 * Note: This function does NOT perform translation. Use processSubtitleWithTranslations
 * for the complete flow including LLM translation.
 * 
 * @param segment - Subtitle segment to process
 * @param profile - User profile
 * @returns Processed segment with word analysis
 * 
 * @example
 * ```typescript
 * const segment = {
 *   startTime: 0,
 *   endTime: 3,
 *   originalText: "I'm learning English",
 *   enhancedHTML: "",
 *   words: []
 * };
 * const processed = processSubtitle(segment, userProfile);
 * // processed.words will contain analysis for each word
 * ```
 */
export function processSubtitle(
  segment: SubtitleSegment,
  profile: UserProfile
): SubtitleSegment {
  // Analyze all words in the subtitle
  const words = analyzeWords(segment.originalText, profile);
  
  return {
    ...segment,
    words,
  };
}

/**
 * Builds enhanced HTML from subtitle segment with translations
 * 
 * Creates HTML markup where:
 * - Known words are plain text
 * - Unknown words are wrapped in <span> with translation tooltip
 * - Maintains original text structure and spacing
 * 
 * @param segment - Subtitle segment with words and translations
 * @returns Enhanced HTML string
 * 
 * @example
 * ```typescript
 * const html = buildEnhancedHTML(segment);
 * // => "I'm <span class='unknown-word' data-translation='学习'>learning</span> English"
 * ```
 */
export function buildEnhancedHTML(segment: SubtitleSegment): string {
  const { originalText, words } = segment;
  
  if (!words || words.length === 0) {
    return originalText;
  }
  
  let html = '';
  let lastIndex = 0;
  
  for (const wordInfo of words) {
    const { word, position, isUnknown, translation } = wordInfo;
    
    // Add text before this word
    if (position.start > lastIndex) {
      html += originalText.substring(lastIndex, position.start);
    }
    
    // Add the word (with or without translation)
    if (isUnknown && translation) {
      // Escape HTML in translation
      const escapedTranslation = escapeHtml(translation);
      
      html += `<span class="yse-unknown-word" data-word="${word}">${word}<sup class="yse-translation">${escapedTranslation}</sup></span>`;
    } else {
      html += word;
    }
    
    lastIndex = position.end;
  }
  
  // Add remaining text
  if (lastIndex < originalText.length) {
    html += originalText.substring(lastIndex);
  }
  
  return html;
}

/**
 * Escapes HTML special characters in a string
 * 
 * @param text - Text to escape
 * @returns HTML-escaped text
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  
  return text.replace(/[&<>"']/g, (char) => map[char] || char);
}

/**
 * Identifies unknown words that need translation
 * 
 * Filters the word analysis results to return only words that:
 * - Are marked as unknown (isUnknown === true)
 * - Don't already have a translation
 * - Are actual content words (not punctuation)
 * 
 * @param words - Word analysis results
 * @returns Array of unknown words needing translation
 * 
 * @example
 * ```typescript
 * const unknownWords = identifyUnknownWords(segment.words);
 * // => ["complicated", "hypothesis"]
 * ```
 */
export function identifyUnknownWords(words: WordAnalysis[], context: string): Array<{
  word: string;
  lemma: string;
  context: string;
}> {
  return words
    .filter(w => w.isUnknown && !w.translation)
    .map(w => ({
      word: w.word,
      lemma: w.lemma,
      context: context,
    }));
}

/**
 * Applies translations to word analysis results
 * 
 * Updates the words array with translations from LLM service.
 * Matches translations by lemma to handle different word forms.
 * 
 * @param words - Word analysis results
 * @param translations - Translations map (lemma -> translation)
 * @returns Updated words with translations
 * 
 * @example
 * ```typescript
 * const translations = new Map([["run", "跑"]]);
 * const updated = applyTranslations(words, translations);
 * // Words with lemma "run" will have translation "跑"
 * ```
 */
export function applyTranslations(
  words: WordAnalysis[],
  translations: Map<string, string>
): WordAnalysis[] {
  return words.map(word => {
    if (word.isUnknown) {
      const translation = translations.get(word.lemma) || translations.get(word.word.toLowerCase());
      if (translation) {
        return {
          ...word,
          translation,
        };
      }
    }
    return word;
  });
}

/**
 * Batch processes multiple subtitle segments
 * 
 * Efficiently processes an array of segments by:
 * 1. Analyzing words in all segments
 * 2. Collecting unique unknown words
 * 3. (Caller should) Batch translate all unique words
 * 4. (Caller should) Apply translations to all segments
 * 
 * This function only does steps 1-2. Steps 3-4 should be done by the caller
 * using LLM service and applyTranslations.
 * 
 * @param segments - Array of subtitle segments
 * @param profile - User profile
 * @returns Processed segments with word analysis
 * 
 * @example
 * ```typescript
 * const processed = processSubtitleBatch(segments, profile);
 * // Now collect unknown words and translate them
 * const unknownWords = new Set<string>();
 * processed.forEach(seg => {
 *   seg.words.filter(w => w.isUnknown).forEach(w => unknownWords.add(w.lemma));
 * });
 * ```
 */
export function processSubtitleBatch(
  segments: SubtitleSegment[],
  profile: UserProfile
): SubtitleSegment[] {
  return segments.map(segment => processSubtitle(segment, profile));
}

/**
 * Complete subtitle processing with LLM translations
 * 
 * This is the main entry point for complete subtitle processing. It:
 * 1. Processes all segments to identify unknown words
 * 2. Collects unique unknown words
 * 3. Translates them using LLM service (with caching)
 * 4. Applies translations to all segments
 * 5. Builds enhanced HTML for each segment
 * 
 * @param segments - Array of subtitle segments to process
 * @param profile - User profile with English level and LLM config
 * @returns Processed segments with translations and enhanced HTML
 * 
 * @example
 * ```typescript
 * const segments = await fetchSubtitle(videoId, track);
 * const enhanced = await processSubtitleWithTranslations(segments, profile);
 * // enhanced[0].enhancedHTML contains HTML with translations
 * ```
 */
export async function processSubtitleWithTranslations(
  segments: SubtitleSegment[],
  profile: UserProfile
): Promise<SubtitleSegment[]> {
  console.log(`Processing ${segments.length} subtitle segments...`);
  
  // 1. Analyze all words in the subtitle
  const processedSegments = processSubtitleBatch(segments, profile);
  
  // 2. Collect unique unknown words needing translation
  const unknownWordsMap = new Map<string, { word: string; lemma: string; context: string }>();
  
  processedSegments.forEach(segment => {
    const unknownInSegment = identifyUnknownWords(segment.words, segment.originalText);
    unknownInSegment.forEach(item => {
      // Use lemma as key to avoid duplicate translations for different forms of same word
      if (!unknownWordsMap.has(item.lemma)) {
        unknownWordsMap.set(item.lemma, item);
      }
    });
  });
  
  const requests = Array.from(unknownWordsMap.values());
  
  if (requests.length === 0) {
    console.log('No unknown words found.');
    return processedSegments.map(seg => ({
      ...seg,
      enhancedHTML: buildEnhancedHTML(seg)
    }));
  }
  
  console.log(`Translating ${requests.length} unique unknown words...`);
  
  try {
    // 3. Translate words
    const translationsResult = await translateWords(requests, profile);
    
    // Create a normalized map for easier lookup (lemma -> translation)
    const translations = new Map<string, string>();
    requests.forEach(req => {
      const translation = translationsResult.get(req.word);
      if (translation) {
        translations.set(req.lemma, translation);
      }
    });
    
    // 4. Apply translations and build HTML
    return processedSegments.map(segment => {
      const updatedWords = applyTranslations(segment.words, translations);
      const updatedSegment = {
        ...segment,
        words: updatedWords,
      };
      const html = buildEnhancedHTML(updatedSegment);
      return {
        ...updatedSegment,
        enhancedHTML: html
      };
    });
  } catch (error) {
    console.error('Batch translation failed, falling back to original text:', error);
    return processedSegments.map(seg => ({
      ...seg,
      enhancedHTML: buildEnhancedHTML(seg)
    }));
  }
}
