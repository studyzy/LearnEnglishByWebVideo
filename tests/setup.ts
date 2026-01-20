/**
 * Test Setup File
 * 
 * This file sets up the testing environment for unit and integration tests.
 * It includes:
 * - Chrome API mocks
 * - Global test utilities
 * - Common test fixtures
 * 
 * @author YouTube Subtitle Enhancer Team
 * @since 0.1.0
 */

import { vi } from 'vitest';

// Mock Chrome APIs
const mockStorage = {
  local: {
    get: vi.fn((keys: string | string[] | Record<string, any>) => {
      return Promise.resolve({});
    }),
    set: vi.fn((items: Record<string, any>) => {
      return Promise.resolve();
    }),
    remove: vi.fn((keys: string | string[]) => {
      return Promise.resolve();
    }),
    clear: vi.fn(() => {
      return Promise.resolve();
    }),
    getBytesInUse: vi.fn((keys?: string | string[] | null) => {
      return Promise.resolve(0);
    }),
  },
  onChanged: {
    addListener: vi.fn(),
    removeListener: vi.fn(),
    hasListener: vi.fn(),
  },
};

const mockRuntime = {
  id: 'test-extension-id',
  onMessage: {
    addListener: vi.fn(),
    removeListener: vi.fn(),
    hasListener: vi.fn(),
  },
  onInstalled: {
    addListener: vi.fn(),
    removeListener: vi.fn(),
    hasListener: vi.fn(),
  },
  sendMessage: vi.fn((message: any) => {
    return Promise.resolve({ success: true });
  }),
  getManifest: vi.fn(() => ({
    name: 'YouTube Subtitle Enhancer',
    version: '0.1.0',
    manifest_version: 3,
  })),
  getURL: vi.fn((path: string) => `chrome-extension://test-id/${path}`),
};

const mockTabs = {
  query: vi.fn(() => Promise.resolve([])),
  sendMessage: vi.fn((tabId: number, message: any) => {
    return Promise.resolve({ success: true });
  }),
  create: vi.fn(() => Promise.resolve({})),
  update: vi.fn(() => Promise.resolve({})),
};

const mockI18n = {
  getMessage: vi.fn((key: string) => {
    // Simple mock that returns the key itself
    return key;
  }),
  getUILanguage: vi.fn(() => 'en'),
  getAcceptLanguages: vi.fn(() => Promise.resolve(['en', 'zh-CN'])),
};

// Create global browser/chrome object
const mockBrowser = {
  storage: mockStorage,
  runtime: mockRuntime,
  tabs: mockTabs,
  i18n: mockI18n,
};

// Assign to global
(global as any).browser = mockBrowser;
(global as any).chrome = mockBrowser;

// Mock fetch for LLM API tests
global.fetch = vi.fn((url: string, options?: RequestInit) => {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({
      choices: [
        {
          message: {
            content: '测试翻译',
          },
        },
      ],
    }),
  } as Response);
});

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  
  // Reset storage mock data
  (mockStorage.local.get as any).mockImplementation((keys: any) => {
    return Promise.resolve({});
  });
});

// Cleanup after all tests
afterAll(() => {
  vi.restoreAllMocks();
});

/**
 * Helper function to mock storage data
 * @param data - Data to return from storage.local.get()
 */
export function mockStorageData(data: Record<string, any>) {
  (mockStorage.local.get as any).mockImplementation((keys: any) => {
    if (typeof keys === 'string') {
      return Promise.resolve({ [keys]: data[keys] });
    }
    if (Array.isArray(keys)) {
      const result: Record<string, any> = {};
      keys.forEach((key) => {
        if (key in data) {
          result[key] = data[key];
        }
      });
      return Promise.resolve(result);
    }
    return Promise.resolve(data);
  });
}

/**
 * Helper function to mock LLM API responses
 * @param response - Response to return from fetch
 */
export function mockLLMResponse(response: { content: string; error?: string }) {
  (global.fetch as any).mockImplementation(() => {
    if (response.error) {
      return Promise.resolve({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: { message: response.error } }),
      });
    }
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          choices: [
            {
              message: {
                content: response.content,
              },
            },
          ],
        }),
    });
  });
}

/**
 * Helper function to create a mock UserProfile
 */
export function createMockUserProfile(overrides?: Partial<any>) {
  return {
    englishLevel: 'intermediate',
    llmProvider: 'openai',
    llmApiKey: 'test-api-key',
    masteredWords: [],
    focusWords: [],
    subtitleFontSize: 16,
    subtitlePosition: 'bottom',
    ...overrides,
  };
}

/**
 * Helper function to create mock subtitle segments
 */
export function createMockSubtitleSegment(overrides?: Partial<any>) {
  return {
    startTime: 0,
    endTime: 3,
    originalText: 'Hello world',
    enhancedHTML: '<span>Hello</span> <span>world</span>',
    words: [],
    ...overrides,
  };
}
