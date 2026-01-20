/**
 * LLM Service Unit Tests
 * 
 * Tests for the LLM service module covering:
 * - OpenAI service API key validation
 * - Claude service API key validation
 * - DeepSeek service API key validation
 * - LLM service factory creation
 * - Error handling for invalid API keys
 * 
 * @author YouTube Subtitle Enhancer Team
 * @since 0.1.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  OpenAIService,
  ClaudeService,
  DeepSeekService,
  createLLMService,
} from '../../src/background/llm-service';
import { createMockUserProfile } from '../setup';
import type { UserProfile } from '../../src/types/index';

describe('LLM Service - OpenAI', () => {
  let service: OpenAIService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new OpenAIService('test-api-key', 'gpt-4o-mini');
  });

  describe('validateApiKey', () => {
    it('should return true for valid API key', async () => {
      // Mock successful API response
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ data: [] }),
        } as Response)
      );

      const result = await service.validateApiKey();
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/models',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
          }),
        })
      );
    });

    it('should return false for invalid API key (401)', async () => {
      // Mock 401 unauthorized response
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({
            error: { message: 'Incorrect API key provided' }
          }),
        } as Response)
      );

      const result = await service.validateApiKey();
      expect(result).toBe(false);
    });

    it('should return false for invalid API key (403)', async () => {
      // Mock 403 forbidden response
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 403,
          json: () => Promise.resolve({
            error: { message: 'Access forbidden' }
          }),
        } as Response)
      );

      const result = await service.validateApiKey();
      expect(result).toBe(false);
    });

    it('should return false on network error', async () => {
      // Mock network error
      global.fetch = vi.fn(() =>
        Promise.reject(new Error('Network error'))
      );

      const result = await service.validateApiKey();
      expect(result).toBe(false);
    });

    it('should return false for empty API key', async () => {
      const emptyKeyService = new OpenAIService('', 'gpt-4o-mini');
      
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({
            error: { message: 'API key required' }
          }),
        } as Response)
      );

      const result = await emptyKeyService.validateApiKey();
      expect(result).toBe(false);
    });
  });
});

describe('LLM Service - Claude', () => {
  let service: ClaudeService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ClaudeService('test-api-key', 'claude-3-5-haiku-20241022');
  });

  describe('validateApiKey', () => {
    it('should return true for valid API key', async () => {
      // Mock successful API response
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            id: 'msg_test',
            content: [{ type: 'text', text: 'test' }],
          }),
        } as Response)
      );

      const result = await service.validateApiKey();
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-api-key': 'test-api-key',
            'anthropic-version': '2023-06-01',
          }),
        })
      );
    });

    it('should return false for invalid API key (401)', async () => {
      // Mock 401 unauthorized response
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({
            error: { message: 'Invalid API key' }
          }),
        } as Response)
      );

      const result = await service.validateApiKey();
      expect(result).toBe(false);
    });

    it('should return false for invalid API key (403)', async () => {
      // Mock 403 forbidden response
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 403,
          json: () => Promise.resolve({
            error: { message: 'Access forbidden' }
          }),
        } as Response)
      );

      const result = await service.validateApiKey();
      expect(result).toBe(false);
    });

    it('should return false on network error', async () => {
      // Mock network error
      global.fetch = vi.fn(() =>
        Promise.reject(new Error('Network error'))
      );

      const result = await service.validateApiKey();
      expect(result).toBe(false);
    });

    it('should return false for empty API key', async () => {
      const emptyKeyService = new ClaudeService('', 'claude-3-5-haiku-20241022');
      
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({
            error: { message: 'API key required' }
          }),
        } as Response)
      );

      const result = await emptyKeyService.validateApiKey();
      expect(result).toBe(false);
    });
  });
});

describe('LLM Service - DeepSeek', () => {
  let service: DeepSeekService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DeepSeekService('test-api-key', 'deepseek-chat');
  });

  describe('validateApiKey', () => {
    it('should return true for valid API key', async () => {
      // Mock successful API response
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            choices: [
              {
                message: {
                  content: 'test',
                },
              },
            ],
          }),
        } as Response)
      );

      const result = await service.validateApiKey();
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.deepseek.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should return false for invalid API key (401)', async () => {
      // Mock 401 unauthorized response
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({
            error: { message: 'Invalid API key' }
          }),
        } as Response)
      );

      const result = await service.validateApiKey();
      expect(result).toBe(false);
    });

    it('should return false for invalid API key (403)', async () => {
      // Mock 403 forbidden response
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 403,
          json: () => Promise.resolve({
            error: { message: 'Access forbidden' }
          }),
        } as Response)
      );

      const result = await service.validateApiKey();
      expect(result).toBe(false);
    });

    it('should return false on network error', async () => {
      // Mock network error
      global.fetch = vi.fn(() =>
        Promise.reject(new Error('Network error'))
      );

      const result = await service.validateApiKey();
      expect(result).toBe(false);
    });

    it('should return false for empty API key', async () => {
      const emptyKeyService = new DeepSeekService('', 'deepseek-chat');
      
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({
            error: { message: 'API key required' }
          }),
        } as Response)
      );

      const result = await emptyKeyService.validateApiKey();
      expect(result).toBe(false);
    });
  });
});

describe('LLM Service - Factory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create OpenAI service for openai provider', () => {
    const profile = createMockUserProfile({
      llmProvider: 'openai',
      llmApiKey: 'sk-test123',
      llmModel: 'gpt-4o-mini',
    }) as UserProfile;

    const service = createLLMService(profile);
    expect(service).toBeInstanceOf(OpenAIService);
  });

  it('should create Claude service for claude provider', () => {
    const profile = createMockUserProfile({
      llmProvider: 'claude',
      llmApiKey: 'sk-ant-test123',
      llmModel: 'claude-3-5-haiku-20241022',
    }) as UserProfile;

    const service = createLLMService(profile);
    expect(service).toBeInstanceOf(ClaudeService);
  });

  it('should create DeepSeek service for deepseek provider', () => {
    const profile = createMockUserProfile({
      llmProvider: 'deepseek',
      llmApiKey: 'sk-test123',
      llmModel: 'deepseek-chat',
    }) as UserProfile;

    const service = createLLMService(profile);
    expect(service).toBeInstanceOf(DeepSeekService);
  });

  it('should throw error when API key is missing', () => {
    const profile = createMockUserProfile({
      llmProvider: 'openai',
      llmApiKey: '',
      llmModel: 'gpt-4o-mini',
    }) as UserProfile;

    expect(() => createLLMService(profile)).toThrow('LLM API key not configured');
  });

  it('should throw error for unsupported provider', () => {
    const profile = createMockUserProfile({
      llmProvider: 'gemini' as any,
      llmApiKey: 'test-key',
      llmModel: 'gemini-pro',
    }) as UserProfile;

    expect(() => createLLMService(profile)).toThrow('Unsupported LLM provider: gemini');
  });
});
