/**
 * Message handlers for background service worker
 * 
 * This file contains all message handler implementations to keep
 * the main background script clean and organized.
 * 
 * @module background/handlers
 * @author YouTube Subtitle Enhancer Team
 * @since 0.1.0
 */

import type { CaptionTrack } from '../../src/types/index';
import { MessageType } from '../../src/types/index';
import {
  getUserProfile,
  updateUserProfile,
  addMasteredWord,
  addFocusWord,
  removeFocusWord,
} from '../../src/lib/storage-manager';
import { isUnknownWord } from '../../src/lib/word-difficulty';
import { createErrorMessage } from '../../src/lib/message-bridge';
import { fetchSubtitle } from '../../src/background/subtitle-fetcher';
import { processSubtitleWithTranslations } from '../../src/background/subtitle-processor';

/**
 * Register all message handlers
 */
export function registerAllHandlers(registerHandler: Function): void {
  // Handler for GET_USER_PROFILE messages
  registerHandler(MessageType.GET_USER_PROFILE, async (message: any) => {
    console.log('GET_USER_PROFILE request');
    
    try {
      const profile = await getUserProfile();
      
      return {
        type: MessageType.USER_PROFILE_RESPONSE,
        requestId: message.requestId,
        profile,
      };
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return createErrorMessage(error as Error, message.requestId);
    }
  });

  // Handler for UPDATE_USER_PROFILE messages
  registerHandler(MessageType.UPDATE_USER_PROFILE, async (message: any) => {
    console.log('UPDATE_USER_PROFILE request');
    
    try {
      const updates = message.payload?.updates || message.updates;
      if (!updates) {
        throw new Error('No updates provided');
      }
      
      await updateUserProfile(updates);
      const profile = await getUserProfile();
      
      return {
        type: MessageType.USER_PROFILE_RESPONSE,
        requestId: message.requestId,
        profile,
      };
    } catch (error) {
      console.error('Failed to update user profile:', error);
      return createErrorMessage(error as Error, message.requestId);
    }
  });

  // Handler for ADD_MASTERED_WORD messages
  registerHandler(MessageType.ADD_MASTERED_WORD, async (message: any) => {
    console.log('ADD_MASTERED_WORD request');
    
    try {
      const word = message.payload?.word || message.word;
      const lemma = message.payload?.lemma || message.lemma;
      const source = message.payload?.source || message.source;
      
      if (!word) {
        throw new Error('No word provided');
      }
      
      await addMasteredWord(word, lemma, source);
      
      // Remove from focus words if present
      try {
        await removeFocusWord(word);
      } catch {
        // Ignore error if word wasn't in focus words
      }
      
      return {
        type: MessageType.WORD_STATUS_RESPONSE,
        requestId: message.requestId,
        word,
        isMastered: true,
        isUnknown: false,
      };
    } catch (error) {
      console.error('Failed to add mastered word:', error);
      return createErrorMessage(error as Error, message.requestId);
    }
  });

  // Handler for ADD_FOCUS_WORD messages
  registerHandler(MessageType.ADD_FOCUS_WORD, async (message: any) => {
    console.log('ADD_FOCUS_WORD request');
    
    try {
      const word = message.payload?.word || message.word;
      const lemma = message.payload?.lemma || message.lemma;
      const context = message.payload?.context || message.context;
      
      if (!word) {
        throw new Error('No word provided');
      }
      
      await addFocusWord(word, lemma, context);
      
      return {
        type: MessageType.WORD_STATUS_RESPONSE,
        requestId: message.requestId,
        word,
        isFocus: true,
      };
    } catch (error) {
      console.error('Failed to add focus word:', error);
      return createErrorMessage(error as Error, message.requestId);
    }
  });

  // Handler for REMOVE_FOCUS_WORD messages
  registerHandler(MessageType.REMOVE_FOCUS_WORD, async (message: any) => {
    console.log('REMOVE_FOCUS_WORD request');
    
    try {
      const word = message.payload?.word || message.word;
      if (!word) {
        throw new Error('No word provided');
      }
      
      await removeFocusWord(word);
      
      return {
        type: MessageType.WORD_STATUS_RESPONSE,
        requestId: message.requestId,
        word,
        isFocus: false,
      };
    } catch (error) {
      console.error('Failed to remove focus word:', error);
      return createErrorMessage(error as Error, message.requestId);
    }
  });

  // Handler for CHECK_WORD_STATUS messages
  registerHandler(MessageType.CHECK_WORD_STATUS, async (message: any) => {
    console.log('CHECK_WORD_STATUS request');
    
    try {
      const word = message.payload?.word || message.word;
      const lemma = message.payload?.lemma || message.lemma;
      
      if (!word) {
        throw new Error('No word provided');
      }
      
      const profile = await getUserProfile();
      const unknown = isUnknownWord(word, profile, lemma);
      
      return {
        type: MessageType.WORD_STATUS_RESPONSE,
        requestId: message.requestId,
        word,
        isUnknown: unknown,
      };
    } catch (error) {
      console.error('Failed to check word status:', error);
      return createErrorMessage(error as Error, message.requestId);
    }
  });

  // Handler for GET_SUBTITLE messages
  registerHandler(MessageType.GET_SUBTITLE, async (message: any) => {
    const videoId = message.payload?.videoId || message.videoId;
    console.log(`GET_SUBTITLE request for video: ${videoId}`);
    
    try {
      const videoId = message.payload?.videoId || message.videoId;
      const captionTrack = message.payload?.captionTrack || message.captionTrack;
      const forceRefresh = message.payload?.forceRefresh || message.forceRefresh;
      const rawSubtitleData = message.payload?.rawSubtitleData || message.rawSubtitleData;
      
      if (!videoId) {
        throw new Error('No videoId provided');
      }
      
      if (!captionTrack) {
        throw new Error('No captionTrack provided');
      }

      // 1. Check cache first (unless force refresh)
      if (!forceRefresh) {
        const { getCachedVideoSession } = await import('../../src/lib/storage-manager');
        const cached = await getCachedVideoSession(videoId);
        if (cached && cached.segments && cached.segments.length > 0) {
          console.log(`Using cached subtitle for video: ${videoId}`);
          return {
            type: MessageType.SUBTITLE_RESPONSE,
            requestId: message.requestId,
            session: cached,
            fromCache: true,
          };
        }
      }

      let segments;

      if (rawSubtitleData) {
        console.log('Using raw subtitle data provided by content script');
        const { parseJSON3Format } = await import('../../src/background/subtitle-fetcher');
        segments = parseJSON3Format(rawSubtitleData);
        
        // Cache the raw data for future use (T026 requirement)
        const { cacheVideoSession } = await import('../../src/lib/storage-manager');
        try {
          await cacheVideoSession({
            videoId,
            videoTitle: '', 
            subtitleLanguage: captionTrack.languageCode,
            subtitleTrackUrl: captionTrack.baseUrl || '',
            isAutoGenerated: captionTrack.isAutoGenerated || false,
            segments,
            isProcessing: false,
            processingProgress: 100,
            lastProcessedTime: Date.now(),
            cacheExpiry: Date.now() + 7 * 24 * 60 * 60 * 1000,
          });
          console.log('Raw subtitle data cached successfully');
        } catch (cacheError) {
          console.warn('Failed to cache raw subtitle data:', cacheError);
        }
      } else {
        // No raw data and no cache - ask content script to download
        console.log(`Cache miss for video ${videoId}, requesting download from content script`);
        return {
          type: MessageType.CACHE_MISS,
          requestId: message.requestId,
        };
      }
      
      console.log(`Processing ${segments.length} subtitle segments for video ${videoId}`);
      
      // Get user profile for translation
      const profile = await getUserProfile();
      
      // Process subtitles with LLM translations
      const processedSegments = await processSubtitleWithTranslations(segments, profile);
      
      console.log(`Processed ${processedSegments.length} segments with translations`);
      
      return {
        type: MessageType.SUBTITLE_RESPONSE,
        requestId: message.requestId,
        session: {
          videoId,
          segments: processedSegments,
          captionTrack,
          // Fill in required VideoSession fields
          subtitleLanguage: captionTrack.languageCode,
          subtitleTrackUrl: '',
          isAutoGenerated: captionTrack.isAutoGenerated,
          isProcessing: false,
          processingProgress: 100,
          lastProcessedTime: Date.now(),
          cacheExpiry: Date.now() + 7 * 24 * 60 * 60 * 1000,
        },
        fromCache: false,
      };
    } catch (error) {
      console.error('Failed to get subtitle:', error);
      return createErrorMessage(error as Error, message.requestId);
    }
  });

  // Handler for TRANSLATE_WORDS messages
  registerHandler(MessageType.TRANSLATE_WORDS, async (message: any) => {
    console.log('TRANSLATE_WORDS request');
    
    try {
      const words = message.payload?.words || message.words;
      
      if (!words || !Array.isArray(words)) {
        throw new Error('No words provided');
      }
      
      // TODO: Implement LLM translation in T028-T033
      console.warn('Word translation not yet implemented (T028-T033)');
      
      return {
        type: MessageType.TRANSLATION_RESPONSE,
        requestId: message.requestId,
        translations: words.map((item: any) => ({
          word: item.word || item,
          translation: '(翻译功能开发中)',
        })),
      };
    } catch (error) {
      console.error('Failed to translate words:', error);
      return createErrorMessage(error as Error, message.requestId);
    }
  });
}
