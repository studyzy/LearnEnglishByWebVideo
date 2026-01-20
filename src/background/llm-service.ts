/**
 * LLM Translation Service
 * 
 * Provides contextual English to Chinese translations using OpenAI or Claude APIs.
 * Implements caching, rate limiting, and batch processing for efficiency.
 * 
 * @module background/llm-service
 * @author YouTube Subtitle Enhancer Team
 * @since 0.1.0
 */

import type { UserProfile } from '../types/index';
import { cacheTranslation, getTranslationCache } from '../lib/storage-manager';

/**
 * Translation request for a single word
 */
export interface TranslationRequest {
  /** Word to translate */
  word: string;
  /** Context sentence containing the word */
  context: string;
}

/**
 * Translation result for a single word
 */
export interface TranslationResult {
  /** Original word */
  word: string;
  /** Chinese translation */
  translation: string;
  /** Whether result came from cache */
  fromCache: boolean;
}

/**
 * Base interface for LLM service providers
 */
export interface LLMService {
  /**
   * Get contextual translation for a single word
   */
  getContextualExplanation(word: string, context: string): Promise<string>;
  
  /**
   * Get contextual translations for multiple words (batch)
   */
  getContextualExplanationsBatch(requests: TranslationRequest[]): Promise<Map<string, string>>;
  
  /**
   * Validate API key
   */
  validateApiKey(): Promise<boolean>;
}

/**
 * OpenAI GPT Service Implementation
 */
export class OpenAIService implements LLMService {
  private apiKey: string;
  private model: string;
  private baseUrl = 'https://api.openai.com/v1/chat/completions';
  
  constructor(apiKey: string, model: string = 'gpt-4o-mini') {
    this.apiKey = apiKey;
    this.model = model;
  }
  
  /**
   * Get contextual translation for a single word using OpenAI
   */
  async getContextualExplanation(word: string, context: string): Promise<string> {
    const prompt = this.buildPrompt(word, context);
    
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful English learning assistant. Provide concise Chinese translations (max 25 characters) for English words based on their context.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 50,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
        throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
      }
      
      const data = await response.json();
      const translation = data.choices?.[0]?.message?.content?.trim();
      
      if (!translation) {
        throw new Error('No translation returned from OpenAI');
      }
      
      return translation;
    } catch (error) {
      console.error('OpenAI API call failed:', error);
      throw error;
    }
  }
  
  /**
   * Get batch translations using OpenAI
   * Makes multiple parallel requests for better performance
   */
  async getContextualExplanationsBatch(requests: TranslationRequest[]): Promise<Map<string, string>> {
    const translations = new Map<string, string>();
    
    // Process in batches of 5 to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      
      const promises = batch.map(async (req) => {
        try {
          const translation = await this.getContextualExplanation(req.word, req.context);
          return { word: req.word, translation };
        } catch (error) {
          console.error(`Failed to translate "${req.word}":`, error);
          return { word: req.word, translation: '(翻译失败)' };
        }
      });
      
      const results = await Promise.all(promises);
      results.forEach(({ word, translation }) => {
        translations.set(word, translation);
      });
      
      // Small delay between batches to respect rate limits
      if (i + batchSize < requests.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return translations;
  }
  
  /**
   * Validate OpenAI API key by making a test request
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      
      return response.ok;
    } catch (error) {
      console.error('API key validation failed:', error);
      return false;
    }
  }
  
  /**
   * Build translation prompt for OpenAI
   */
  private buildPrompt(word: string, context: string): string {
    return `请提供英文单词"${word}"在以下句子中的中文翻译（不超过25个字符）：

句子: ${context}

要求:
- 只返回中文翻译，不要解释
- 翻译要简洁准确
- 考虑上下文语境`;
  }
}

/**
 * Claude (Anthropic) Service Implementation
 */
export class ClaudeService implements LLMService {
  private apiKey: string;
  private model: string;
  private baseUrl = 'https://api.anthropic.com/v1/messages';
  
  constructor(apiKey: string, model: string = 'claude-3-5-haiku-20241022') {
    this.apiKey = apiKey;
    this.model = model;
  }
  
  /**
   * Get contextual translation for a single word using Claude
   */
  async getContextualExplanation(word: string, context: string): Promise<string> {
    const prompt = this.buildPrompt(word, context);
    
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 50,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
        throw new Error(`Claude API error: ${error.error?.message || response.statusText}`);
      }
      
      const data = await response.json();
      const translation = data.content?.[0]?.text?.trim();
      
      if (!translation) {
        throw new Error('No translation returned from Claude');
      }
      
      return translation;
    } catch (error) {
      console.error('Claude API call failed:', error);
      throw error;
    }
  }
  
  /**
   * Get batch translations using Claude
   */
  async getContextualExplanationsBatch(requests: TranslationRequest[]): Promise<Map<string, string>> {
    const translations = new Map<string, string>();
    
    // Process in batches of 5
    const batchSize = 5;
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      
      const promises = batch.map(async (req) => {
        try {
          const translation = await this.getContextualExplanation(req.word, req.context);
          return { word: req.word, translation };
        } catch (error) {
          console.error(`Failed to translate "${req.word}":`, error);
          return { word: req.word, translation: '(翻译失败)' };
        }
      });
      
      const results = await Promise.all(promises);
      results.forEach(({ word, translation }) => {
        translations.set(word, translation);
      });
      
      // Small delay between batches
      if (i + batchSize < requests.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return translations;
  }
  
  /**
   * Validate Claude API key by making a test request
   */
  async validateApiKey(): Promise<boolean> {
    try {
      // Make a minimal request to check authentication
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 1,
          messages: [
            {
              role: 'user',
              content: 'Hi',
            },
          ],
        }),
      });
      
      return response.ok;
    } catch (error) {
      console.error('API key validation failed:', error);
      return false;
    }
  }
  
  /**
   * Build translation prompt for Claude
   */
  private buildPrompt(word: string, context: string): string {
    return `请提供英文单词"${word}"在以下句子中的中文翻译（不超过25个字符）：

句子: ${context}

要求:
- 只返回中文翻译，不要解释
- 翻译要简洁准确
- 考虑上下文语境`;
  }
}

/**
 * DeepSeek Service Implementation
 * Compatible with OpenAI API format
 */
export class DeepSeekService implements LLMService {
  private apiKey: string;
  private model: string;
  private baseUrl = 'https://api.deepseek.com/v1/chat/completions';
  
  constructor(apiKey: string, model: string = 'deepseek-chat') {
    this.apiKey = apiKey;
    this.model = model;
  }
  
  /**
   * Get contextual translation for a single word using DeepSeek
   */
  async getContextualExplanation(word: string, context: string): Promise<string> {
    const prompt = this.buildPrompt(word, context);
    
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful English learning assistant. Provide concise Chinese translations (max 25 characters) for English words based on their context.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 50,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
        throw new Error(`DeepSeek API error: ${error.error?.message || response.statusText}`);
      }
      
      const data = await response.json();
      const translation = data.choices?.[0]?.message?.content?.trim();
      
      if (!translation) {
        throw new Error('No translation returned from DeepSeek');
      }
      
      return translation;
    } catch (error) {
      console.error('DeepSeek API call failed:', error);
      throw error;
    }
  }
  
  /**
   * Get batch translations using DeepSeek
   */
  async getContextualExplanationsBatch(requests: TranslationRequest[]): Promise<Map<string, string>> {
    const translations = new Map<string, string>();
    
    // Process in batches of 5 to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      
      const promises = batch.map(async (req) => {
        try {
          const translation = await this.getContextualExplanation(req.word, req.context);
          return { word: req.word, translation };
        } catch (error) {
          console.error(`Failed to translate "${req.word}":`, error);
          return { word: req.word, translation: '(翻译失败)' };
        }
      });
      
      const results = await Promise.all(promises);
      results.forEach(({ word, translation }) => {
        translations.set(word, translation);
      });
      
      // Small delay between batches to respect rate limits
      if (i + batchSize < requests.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return translations;
  }
  
  /**
   * Validate DeepSeek API key by making a test request
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'user',
              content: 'Hi',
            },
          ],
          max_tokens: 1,
        }),
      });
      
      return response.ok;
    } catch (error) {
      console.error('API key validation failed:', error);
      return false;
    }
  }
  
  /**
   * Build translation prompt for DeepSeek
   */
  private buildPrompt(word: string, context: string): string {
    return `请提供英文单词"${word}"在以下句子中的中文翻译（不超过25个字符）：

句子: ${context}

要求:
- 只返回中文翻译，不要解释
- 翻译要简洁准确
- 考虑上下文语境`;
  }
}

/**
 * LLM Service Factory
 * 
 * Creates the appropriate LLM service based on user profile
 */
export function createLLMService(profile: UserProfile): LLMService {
  const { llmProvider, llmApiKey, llmModel } = profile;
  
  if (!llmApiKey) {
    throw new Error('LLM API key not configured');
  }
  
  switch (llmProvider) {
    case 'openai':
      return new OpenAIService(llmApiKey, llmModel);
    case 'claude':
      return new ClaudeService(llmApiKey, llmModel);
    case 'deepseek':
      return new DeepSeekService(llmApiKey, llmModel);
    default:
      throw new Error(`Unsupported LLM provider: ${llmProvider}`);
  }
}

/**
 * Translate words with caching support
 * 
 * This is the main entry point for translation in the extension.
 * It:
 * 1. Checks cache for existing translations
 * 2. Makes LLM API calls for uncached words
 * 3. Caches new translations
 * 4. Returns all translations
 * 
 * @param requests - Words to translate with context
 * @param profile - User profile with LLM configuration
 * @returns Map of word -> translation
 * 
 * @example
 * ```typescript
 * const requests = [
 *   { word: "complicated", context: "This is a complicated problem" },
 *   { word: "hypothesis", context: "We need to test this hypothesis" }
 * ];
 * const translations = await translateWords(requests, profile);
 * // => Map { "complicated" => "复杂的", "hypothesis" => "假设" }
 * ```
 */
export async function translateWords(
  requests: TranslationRequest[],
  profile: UserProfile
): Promise<Map<string, string>> {
  const translations = new Map<string, string>();
  const uncachedRequests: TranslationRequest[] = [];
  
  // Check cache first
  for (const req of requests) {
    const cached = await getTranslationCache(req.word, req.context);
    if (cached) {
      translations.set(req.word, cached);
    } else {
      uncachedRequests.push(req);
    }
  }
  
  console.log(`Cache hits: ${translations.size}/${requests.length}`);
  
  // Translate uncached words
  if (uncachedRequests.length > 0) {
    try {
      const llmService = createLLMService(profile);
      const newTranslations = await llmService.getContextualExplanationsBatch(uncachedRequests);
      
      // Cache new translations
      for (const [word, translation] of newTranslations) {
        translations.set(word, translation);
        
        // Find the original request to get context
        const originalReq = uncachedRequests.find(r => r.word === word);
        if (originalReq) {
          await cacheTranslation(
            word,
            originalReq.context,
            translation,
            profile.llmProvider,
            profile.llmModel || 'default'
          );
        }
      }
    } catch (error) {
      console.error('Translation failed:', error);
      // Return what we have from cache
      if (translations.size === 0) {
        throw error;
      }
    }
  }
  
  return translations;
}
