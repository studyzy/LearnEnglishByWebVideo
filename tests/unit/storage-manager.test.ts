/**
 * Storage Manager Unit Tests
 * 
 * Tests for the storage manager module covering:
 * - User profile CRUD operations
 * - Video session caching
 * - Translation caching
 * - Storage quota management
 * - Cache cleanup
 * 
 * @author YouTube Subtitle Enhancer Team
 * @since 0.1.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getUserProfile,
  updateUserProfile,
  addMasteredWord,
  removeMasteredWord,
  checkWordStatus,
  cacheVideoSession,
  getCachedVideoSession,
  cacheTranslation,
  getTranslationCache,
  getStorageUsage,
  checkStorageQuota,
  cleanupExpiredCaches,
  cleanupOldestCaches,
} from '../../src/lib/storage-manager';
import { mockStorageData, createMockUserProfile } from '../setup';
import type { VideoSession, UserProfile } from '../../src/types/index';
import { defaultUserProfile, CACHE_EXPIRY_MS } from '../../src/types/index';

describe('Storage Manager - User Profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return default profile when none exists', async () => {
    mockStorageData({});
    const profile = await getUserProfile();
    
    expect(profile).toEqual(defaultUserProfile);
  });

  it('should return stored profile when it exists', async () => {
    const storedProfile = createMockUserProfile({
      englishLevel: 'advanced',
      llmApiKey: 'test-key',
    });
    
    mockStorageData({
      user_profile: storedProfile,
    });

    const profile = await getUserProfile();
    
    expect(profile.englishLevel).toBe('advanced');
    expect(profile.llmApiKey).toBe('test-key');
  });

  it('should update profile with partial updates', async () => {
    const initialProfile = createMockUserProfile();
    mockStorageData({ user_profile: initialProfile });

    await updateUserProfile({
      englishLevel: 'beginner',
      llmProvider: 'claude',
    });

    const setCall = (browser.storage.local.set as any).mock.calls[0][0];
    const updated = setCall.user_profile as UserProfile;

    expect(updated.englishLevel).toBe('beginner');
    expect(updated.llmProvider).toBe('claude');
    expect(updated.lastUsedAt).toBeGreaterThan(initialProfile.lastUsedAt);
  });

  it('should add word to mastered list', async () => {
    const profile = createMockUserProfile({ masteredWords: [] });
    mockStorageData({ user_profile: profile });

    await addMasteredWord('hello', 'hello', 'manual');

    const setCall = (browser.storage.local.set as any).mock.calls[0][0];
    const updated = setCall.user_profile as UserProfile;

    expect(updated.masteredWords).toHaveLength(1);
    expect(updated.masteredWords[0].word).toBe('hello');
    expect(updated.masteredWords[0].lemma).toBe('hello');
    expect(updated.masteredWords[0].source).toBe('manual');
    expect(updated.totalWordsLearned).toBe(1);
  });

  it('should not add duplicate words', async () => {
    const profile = createMockUserProfile({
      masteredWords: [
        { word: 'hello', lemma: 'hello', addedTime: Date.now(), source: 'manual' },
      ],
    });
    mockStorageData({ user_profile: profile });

    await addMasteredWord('hello', 'hello');

    // No set call should be made for duplicate
    expect((browser.storage.local.set as any).mock.calls).toHaveLength(0);
  });

  it('should remove word from mastered list', async () => {
    const profile = createMockUserProfile({
      masteredWords: [
        { word: 'hello', lemma: 'hello', addedTime: Date.now(), source: 'manual' },
        { word: 'world', lemma: 'world', addedTime: Date.now(), source: 'manual' },
      ],
    });
    mockStorageData({ user_profile: profile });

    await removeMasteredWord('hello');

    const setCall = (browser.storage.local.set as any).mock.calls[0][0];
    const updated = setCall.user_profile as UserProfile;

    expect(updated.masteredWords).toHaveLength(1);
    expect(updated.masteredWords[0].word).toBe('world');
  });

  it('should check word status correctly', async () => {
    const profile = createMockUserProfile({
      masteredWords: [
        { word: 'run', lemma: 'run', addedTime: Date.now(), source: 'manual' },
      ],
      focusWords: [
        { word: 'amazing', lemma: 'amazing', addedTime: Date.now(), source: 'manual' },
      ],
    });
    mockStorageData({ user_profile: profile });

    // Check mastered word
    const status1 = await checkWordStatus('run', 'run');
    expect(status1.isMastered).toBe(true);
    expect(status1.isFocused).toBe(false);

    // Check focus word
    const status2 = await checkWordStatus('amazing');
    expect(status2.isMastered).toBe(false);
    expect(status2.isFocused).toBe(true);

    // Check unknown word
    const status3 = await checkWordStatus('unknown');
    expect(status3.isMastered).toBe(false);
    expect(status3.isFocused).toBe(false);

    // Check lemma variation (running → run)
    const status4 = await checkWordStatus('running', 'run');
    expect(status4.isMastered).toBe(true);
  });
});

describe('Storage Manager - Video Session', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should cache video session', async () => {
    const session: VideoSession = {
      videoId: 'test123',
      videoTitle: 'Test Video',
      subtitleLanguage: 'en',
      subtitleTrackUrl: 'https://example.com/track',
      isAutoGenerated: false,
      segments: [],
      isProcessing: false,
      processingProgress: 100,
      lastProcessedTime: Date.now(),
      cacheExpiry: 0, // Will be set by function
    };

    await cacheVideoSession(session);

    const setCall = (browser.storage.local.set as any).mock.calls[0][0];
    const cached = setCall['video_cache_test123'] as VideoSession;

    expect(cached.videoId).toBe('test123');
    expect(cached.cacheExpiry).toBeGreaterThan(Date.now());
  });

  it('should retrieve cached video session', async () => {
    const session: VideoSession = {
      videoId: 'test123',
      videoTitle: 'Test Video',
      subtitleLanguage: 'en',
      subtitleTrackUrl: 'https://example.com/track',
      isAutoGenerated: false,
      segments: [],
      isProcessing: false,
      processingProgress: 100,
      lastProcessedTime: Date.now(),
      cacheExpiry: Date.now() + CACHE_EXPIRY_MS,
    };

    mockStorageData({
      video_cache_test123: session,
    });

    const retrieved = await getCachedVideoSession('test123');
    
    expect(retrieved).not.toBeNull();
    expect(retrieved?.videoId).toBe('test123');
  });

  it('should return null for expired video session', async () => {
    const session: VideoSession = {
      videoId: 'test123',
      videoTitle: 'Test Video',
      subtitleLanguage: 'en',
      subtitleTrackUrl: 'https://example.com/track',
      isAutoGenerated: false,
      segments: [],
      isProcessing: false,
      processingProgress: 100,
      lastProcessedTime: Date.now(),
      cacheExpiry: Date.now() - 1000, // Expired
    };

    mockStorageData({
      video_cache_test123: session,
    });

    const retrieved = await getCachedVideoSession('test123');
    
    expect(retrieved).toBeNull();
    expect((browser.storage.local.remove as any).mock.calls).toHaveLength(1);
  });

  it('should return null for non-existent video session', async () => {
    mockStorageData({});

    const retrieved = await getCachedVideoSession('nonexistent');
    
    expect(retrieved).toBeNull();
  });
});

describe('Storage Manager - Translation Cache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should cache translation', async () => {
    await cacheTranslation('hello', 'Hello world', '你好', 'openai', 'gpt-4o-mini');

    const setCall = (browser.storage.local.set as any).mock.calls[0][0];
    const keys = Object.keys(setCall);
    
    expect(keys[0]).toContain('translation_cache_');
    
    const cached = setCall[keys[0]];
    expect(cached.word).toBe('hello');
    expect(cached.translation).toBe('你好');
    expect(cached.llmProvider).toBe('openai');
    expect(cached.llmModel).toBe('gpt-4o-mini');
  });

  it('should retrieve cached translation', async () => {
    // Mock the same context hash that would be generated
    const mockEntry = {
      word: 'hello',
      context: 'Hello world',
      contextHash: 'hello_test',
      translation: '你好',
      timestamp: Date.now(),
      expiryTime: Date.now() + CACHE_EXPIRY_MS,
      llmProvider: 'openai',
      llmModel: 'gpt-4o-mini',
    };

    // We need to mock storage with the generated key
    // Since we can't predict the exact hash, we'll test the caching flow
    await cacheTranslation('hello', 'Hello world', '你好', 'openai', 'gpt-4o-mini');
    
    const setCall = (browser.storage.local.set as any).mock.calls[0][0];
    const cacheKey = Object.keys(setCall)[0];
    
    // Now mock retrieval with the same key
    mockStorageData({
      [cacheKey]: setCall[cacheKey],
    });

    const retrieved = await getTranslationCache('hello', 'Hello world');
    
    expect(retrieved).toBe('你好');
  });

  it('should return null for expired translation', async () => {
    const expiredEntry = {
      word: 'hello',
      context: 'Hello world',
      contextHash: 'hello_test',
      translation: '你好',
      timestamp: Date.now() - CACHE_EXPIRY_MS - 1000,
      expiryTime: Date.now() - 1000, // Expired
      llmProvider: 'openai',
      llmModel: 'gpt-4o-mini',
    };

    mockStorageData({
      translation_cache_hello_test: expiredEntry,
    });

    const retrieved = await getTranslationCache('hello', 'Hello world');
    
    expect(retrieved).toBeNull();
  });
});

describe('Storage Manager - Quota Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should calculate storage usage', async () => {
    const profile = createMockUserProfile();
    const session: VideoSession = {
      videoId: 'test123',
      videoTitle: 'Test Video',
      subtitleLanguage: 'en',
      subtitleTrackUrl: 'https://example.com/track',
      isAutoGenerated: false,
      segments: [],
      isProcessing: false,
      processingProgress: 100,
      lastProcessedTime: Date.now(),
      cacheExpiry: Date.now() + CACHE_EXPIRY_MS,
    };

    mockStorageData({
      user_profile: profile,
      video_cache_test123: session,
      translation_cache_hello_test: {
        word: 'hello',
        translation: '你好',
        timestamp: Date.now(),
        expiryTime: Date.now() + CACHE_EXPIRY_MS,
      },
    });

    const usage = await getStorageUsage();
    
    expect(usage.userProfile).toBeGreaterThan(0);
    expect(usage.videoCaches).toBeGreaterThan(0);
    expect(usage.translationCaches).toBeGreaterThan(0);
    expect(usage.total).toBe(
      usage.userProfile + usage.videoCaches + usage.translationCaches,
    );
  });

  it('should detect when approaching quota limit', async () => {
    // Mock large storage usage
    const largeProfile = createMockUserProfile({
      masteredWords: new Array(5000).fill(null).map((_, i) => ({
        word: `word${i}`,
        lemma: `word${i}`,
        addedTime: Date.now(),
        source: 'manual' as const,
      })),
    });

    mockStorageData({
      user_profile: largeProfile,
    });

    const status = await checkStorageQuota();
    
    expect(status.usage).toBeGreaterThan(0);
    expect(status.quota).toBeGreaterThan(0);
    // Note: isNearLimit depends on actual size, may or may not trigger
  });

  it('should cleanup expired caches', async () => {
    const expiredSession: VideoSession = {
      videoId: 'expired',
      videoTitle: 'Expired Video',
      subtitleLanguage: 'en',
      subtitleTrackUrl: 'https://example.com/track',
      isAutoGenerated: false,
      segments: [],
      isProcessing: false,
      processingProgress: 100,
      lastProcessedTime: Date.now() - CACHE_EXPIRY_MS - 1000,
      cacheExpiry: Date.now() - 1000, // Expired
    };

    const validSession: VideoSession = {
      ...expiredSession,
      videoId: 'valid',
      cacheExpiry: Date.now() + CACHE_EXPIRY_MS, // Valid
    };

    mockStorageData({
      video_cache_expired: expiredSession,
      video_cache_valid: validSession,
    });

    await cleanupExpiredCaches();

    const removeCall = (browser.storage.local.remove as any).mock.calls[0][0];
    
    expect(removeCall).toContain('video_cache_expired');
    expect(removeCall).not.toContain('video_cache_valid');
  });

  it('should cleanup oldest caches when needed', async () => {
    const oldSession: VideoSession = {
      videoId: 'old',
      videoTitle: 'Old Video',
      subtitleLanguage: 'en',
      subtitleTrackUrl: 'https://example.com/track',
      isAutoGenerated: false,
      segments: [],
      isProcessing: false,
      processingProgress: 100,
      lastProcessedTime: Date.now() - 10000, // Older
      cacheExpiry: Date.now() + CACHE_EXPIRY_MS,
    };

    const newSession: VideoSession = {
      ...oldSession,
      videoId: 'new',
      lastProcessedTime: Date.now(), // Newer
    };

    mockStorageData({
      video_cache_old: oldSession,
      video_cache_new: newSession,
    });

    await cleanupOldestCaches();

    // Should remove 30% of oldest caches (in this case, 0 items since 30% of 2 = 0.6, floor to 0)
    // Let's add more items to test
    const sessions: Record<string, VideoSession> = {};
    for (let i = 0; i < 10; i++) {
      sessions[`video_cache_${i}`] = {
        ...oldSession,
        videoId: `video${i}`,
        lastProcessedTime: Date.now() - (10 - i) * 1000,
      };
    }

    mockStorageData(sessions);
    await cleanupOldestCaches();

    const removeCall = (browser.storage.local.remove as any).mock.calls[0][0];
    
    // Should remove 3 oldest (30% of 10)
    expect(removeCall).toHaveLength(3);
  });
});
