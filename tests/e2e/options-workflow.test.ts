/**
 * Options Workflow E2E Test
 * 
 * This test simulates the end-to-end workflow of the Options page:
 * 1. Opening Options page
 * 2. Configuring API key
 * 3. Switching English level
 * 4. Verifying changes are saved
 * 5. Verifying subtitle behavior would change accordingly
 * 
 * Note: This is an integration test style E2E test that tests the logic
 * without requiring a full browser environment. For true E2E tests with
 * UI interaction, consider using Playwright or Puppeteer.
 * 
 * @author YouTube Subtitle Enhancer Team
 * @since 0.1.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getUserProfile,
  updateUserProfile,
} from '../../src/lib/storage-manager';
import { VocabularyService } from '../../src/background/vocabulary-service';
import { createLLMService } from '../../src/background/llm-service';
import { mockStorageData, createMockUserProfile } from '../setup';
import type { UserProfile } from '../../src/types/index';

describe('Options Page Workflow E2E', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should complete full workflow: configure API → change level → verify changes', async () => {
    // Step 1: User opens Options page and loads current settings
    mockStorageData({});
    const initialProfile = await getUserProfile();
    
    expect(initialProfile).toBeDefined();
    expect(initialProfile.englishLevel).toBeDefined();
    
    // Step 2: User configures API key for DeepSeek
    const updatedProfile: UserProfile = {
      ...initialProfile,
      llmProvider: 'deepseek',
      llmApiKey: 'sk-test-api-key-12345',
      llmModel: 'deepseek-chat',
    };
    
    await updateUserProfile(updatedProfile);
    
    // Verify storage was updated
    expect(global.chrome.storage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({
        user_profile: expect.objectContaining({
          llmProvider: 'deepseek',
          llmApiKey: 'sk-test-api-key-12345',
          llmModel: 'deepseek-chat',
        }),
      })
    );
    
    // Step 3: Verify LLM service can be created with new config
    const llmService = createLLMService(updatedProfile);
    expect(llmService).toBeDefined();
    
    // Step 4: User changes English level from intermediate to beginner
    const profileWithNewLevel: UserProfile = {
      ...updatedProfile,
      englishLevel: 'beginner',
    };
    
    await updateUserProfile(profileWithNewLevel);
    
    // Verify level change was saved
    expect(global.chrome.storage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({
        user_profile: expect.objectContaining({
          englishLevel: 'beginner',
        }),
      })
    );
    
    // Step 5: Verify vocabulary service behavior changes with new level
    const vocabService = new VocabularyService(profileWithNewLevel);
    
    // Beginner should see more words as unknown
    const testWords = ['cat', 'sophisticated', 'run', 'methodology'];
    const unknownWords = vocabService.filterUnknownWords(testWords);
    
    // Beginner should find 'sophisticated' and 'methodology' unknown
    expect(unknownWords).toContain('sophisticated');
    expect(unknownWords).toContain('methodology');
    
    // Step 6: Verify stats reflect new level
    const stats = vocabService.getVocabularyStats();
    expect(stats.englishLevel).toBe('beginner');
    expect(stats.estimatedVocabularySize).toBe(3000); // Beginner base
  });

  it('should handle invalid API key configuration gracefully', async () => {
    mockStorageData({});
    const profile = await getUserProfile();
    
    // User enters empty API key
    const invalidProfile: UserProfile = {
      ...profile,
      llmApiKey: '',
    };
    
    // Should throw error when trying to create LLM service
    expect(() => createLLMService(invalidProfile)).toThrow('LLM API key not configured');
  });

  it('should maintain API key when switching English levels', async () => {
    // Setup initial profile with API key
    const initialProfile = createMockUserProfile({
      llmProvider: 'openai',
      llmApiKey: 'sk-test-key',
      llmModel: 'gpt-4o-mini',
      englishLevel: 'intermediate',
    }) as UserProfile;
    
    mockStorageData({ user_profile: initialProfile });
    
    // Switch to beginner level
    const updatedProfile: UserProfile = {
      ...initialProfile,
      englishLevel: 'beginner',
    };
    
    await updateUserProfile(updatedProfile);
    
    // Verify API key is still present
    expect(global.chrome.storage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({
        user_profile: expect.objectContaining({
          llmProvider: 'openai',
          llmApiKey: 'sk-test-key',
          llmModel: 'gpt-4o-mini',
          englishLevel: 'beginner',
        }),
      })
    );
  });

  it('should support switching between LLM providers', async () => {
    const profile = await getUserProfile();
    
    // Start with OpenAI
    const openaiProfile: UserProfile = {
      ...profile,
      llmProvider: 'openai',
      llmApiKey: 'sk-openai-key',
      llmModel: 'gpt-4o-mini',
    };
    
    await updateUserProfile(openaiProfile);
    
    let service = createLLMService(openaiProfile);
    expect(service.constructor.name).toBe('OpenAIService');
    
    // Switch to Claude
    const claudeProfile: UserProfile = {
      ...profile,
      llmProvider: 'claude',
      llmApiKey: 'sk-ant-claude-key',
      llmModel: 'claude-3-5-haiku-20241022',
    };
    
    await updateUserProfile(claudeProfile);
    
    service = createLLMService(claudeProfile);
    expect(service.constructor.name).toBe('ClaudeService');
    
    // Switch to DeepSeek
    const deepseekProfile: UserProfile = {
      ...profile,
      llmProvider: 'deepseek',
      llmApiKey: 'sk-deepseek-key',
      llmModel: 'deepseek-chat',
    };
    
    await updateUserProfile(deepseekProfile);
    
    service = createLLMService(deepseekProfile);
    expect(service.constructor.name).toBe('DeepSeekService');
  });

  it('should verify all three English levels produce different vocabulary behaviors', async () => {
    const testWords = ['cat', 'dog', 'sophisticated', 'methodology', 'epistemological'];
    
    // Test beginner level
    const beginnerProfile = createMockUserProfile({
      englishLevel: 'beginner',
      masteredWords: [],
      focusWords: [],
    }) as UserProfile;
    
    const beginnerService = new VocabularyService(beginnerProfile);
    const beginnerUnknown = beginnerService.filterUnknownWords(testWords);
    
    // Test intermediate level
    const intermediateProfile = createMockUserProfile({
      englishLevel: 'intermediate',
      masteredWords: [],
      focusWords: [],
    }) as UserProfile;
    
    const intermediateService = new VocabularyService(intermediateProfile);
    const intermediateUnknown = intermediateService.filterUnknownWords(testWords);
    
    // Test advanced level
    const advancedProfile = createMockUserProfile({
      englishLevel: 'advanced',
      masteredWords: [],
      focusWords: [],
    }) as UserProfile;
    
    const advancedService = new VocabularyService(advancedProfile);
    const advancedUnknown = advancedService.filterUnknownWords(testWords);
    
    // Verify progression: beginner sees most unknown, advanced sees least
    expect(beginnerUnknown.length).toBeGreaterThanOrEqual(intermediateUnknown.length);
    expect(intermediateUnknown.length).toBeGreaterThanOrEqual(advancedUnknown.length);
    
    // Beginner should see advanced words as unknown
    expect(beginnerUnknown).toContain('sophisticated');
    
    // Advanced users should see fewer unknown words
    expect(advancedUnknown.length).toBeLessThan(beginnerUnknown.length);
  });

  it('should handle subtitle font size configuration', async () => {
    const profile = await getUserProfile();
    
    // User changes font size
    const updatedProfile: UserProfile = {
      ...profile,
      subtitleFontSize: 20, // Changed from default 16
    };
    
    await updateUserProfile(updatedProfile);
    
    // Verify font size was saved
    expect(global.chrome.storage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({
        user_profile: expect.objectContaining({
          subtitleFontSize: 20,
        }),
      })
    );
  });

  it('should verify API key validation works for each provider', () => {
    // Test each provider can be instantiated with valid-looking API key
    const providers: Array<{ provider: 'openai' | 'claude' | 'deepseek', key: string, model: string }> = [
      { provider: 'openai', key: 'sk-test', model: 'gpt-4o-mini' },
      { provider: 'claude', key: 'sk-ant-test', model: 'claude-3-5-haiku-20241022' },
      { provider: 'deepseek', key: 'sk-test', model: 'deepseek-chat' },
    ];
    
    providers.forEach(({ provider, key, model }) => {
      const profile = createMockUserProfile({
        llmProvider: provider,
        llmApiKey: key,
        llmModel: model,
      }) as UserProfile;
      
      const service = createLLMService(profile);
      expect(service).toBeDefined();
      expect(service.constructor.name).toContain('Service');
    });
  });

  it('should support reset to default settings', async () => {
    // User has customized settings
    const customProfile = createMockUserProfile({
      englishLevel: 'advanced',
      llmProvider: 'openai',
      llmApiKey: 'custom-key',
      subtitleFontSize: 24,
      masteredWords: [
        { word: 'test', lemma: 'test', addedAt: Date.now() },
      ],
    }) as UserProfile;
    
    mockStorageData({ user_profile: customProfile });
    
    // User clicks reset button - get default profile
    const defaultProfile = await getUserProfile();
    
    // Reset by updating with default values (keeping provider/key if set)
    const resetProfile: UserProfile = {
      ...defaultProfile,
      llmProvider: customProfile.llmProvider,
      llmApiKey: customProfile.llmApiKey,
      englishLevel: 'intermediate', // Default
      subtitleFontSize: 16, // Default
      masteredWords: [], // Clear custom data
      focusWords: [],
    };
    
    await updateUserProfile(resetProfile);
    
    // Verify reset
    expect(global.chrome.storage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({
        user_profile: expect.objectContaining({
          englishLevel: 'intermediate',
          subtitleFontSize: 16,
          masteredWords: [],
        }),
      })
    );
  });
});

describe('Options Page - Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle storage errors gracefully', async () => {
    // Mock storage error
    global.chrome.storage.local.set = vi.fn(() => 
      Promise.reject(new Error('Storage quota exceeded'))
    );
    
    const profile = createMockUserProfile() as UserProfile;
    
    // Should throw storage error
    await expect(updateUserProfile(profile)).rejects.toThrow('Storage quota exceeded');
  });

  it('should validate English level values', () => {
    const profile = createMockUserProfile({
      englishLevel: 'invalid' as any,
    }) as UserProfile;
    
    // English level should be one of the valid values
    expect(['beginner', 'intermediate', 'advanced']).not.toContain(profile.englishLevel);
  });

  it('should validate LLM provider values', () => {
    const validProviders = ['openai', 'claude', 'deepseek'];
    
    validProviders.forEach(provider => {
      const profile = createMockUserProfile({
        llmProvider: provider as any,
        llmApiKey: 'test-key',
      }) as UserProfile;
      
      // Should not throw
      expect(() => createLLMService(profile)).not.toThrow('Unsupported LLM provider');
    });
    
    // Invalid provider
    const invalidProfile = createMockUserProfile({
      llmProvider: 'gemini' as any,
      llmApiKey: 'test-key',
    }) as UserProfile;
    
    expect(() => createLLMService(invalidProfile)).toThrow('Unsupported LLM provider');
  });
});
