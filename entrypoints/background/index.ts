/**
 * Background Service Worker
 * 
 * This is the main background script for the YouTube Subtitle Enhancer extension.
 * It runs as a Service Worker in Manifest V3 and handles:
 * - LLM API calls for translations
 * - Subtitle processing and caching
 * - Message passing with content scripts
 * - Storage management and cache cleanup
 * 
 * @author YouTube Subtitle Enhancer Team
 * @since 0.1.0
 */

import type { UserProfile } from '../../src/types/index';
import { MessageType } from '../../src/types/index';
import {
  updateUserProfile,
  cleanupExpiredCaches,
  checkStorageQuota,
} from '../../src/lib/storage-manager';
import { registerMessageHandler } from '../../src/lib/message-bridge';
import { registerAllHandlers } from './handlers';

/**
 * Default user profile used for new installations
 */
const defaultUserProfile: UserProfile = {
  englishLevel: 'intermediate',
  llmProvider: 'openai',
  llmApiKey: '',
  llmModel: 'gpt-4o-mini',
  masteredWords: [],
  focusWords: [],
  subtitleFontSize: 16,
  subtitleFontColor: '#ffffff',
  subtitleBackgroundColor: 'rgba(0,0,0,0.8)',
  translationColor: '#ffeb3b',
  isEnabled: true,
  showOnboardingGuide: true,
  totalVideosWatched: 0,
  totalWordsLearned: 0,
  createdAt: Date.now(),
  lastUsedAt: Date.now(),
};

export default defineBackground(() => {
  console.log('YouTube Subtitle Enhancer Service Worker started', { id: browser.runtime.id });

  /**
   * Initialize extension on installation
   * Sets up default user profile and performs initial cache cleanup
   */
  browser.runtime.onInstalled.addListener(async (details) => {
    console.log('onInstalled event:', details.reason);
    
    if (details.reason === 'install') {
      console.log('Extension installed, initializing default settings...');
      
      try {
        // Initialize default user profile
        await updateUserProfile(defaultUserProfile);
        console.log('Default user profile initialized');
        
        // Open welcome page
        await browser.tabs.create({
          url: browser.runtime.getURL('/popup.html'),
        });
      } catch (error) {
        console.error('Failed to initialize default settings:', error);
      }
    } else if (details.reason === 'update') {
      console.log('Extension updated to version:', browser.runtime.getManifest().version);
      
      // Cleanup expired caches on update
      try {
        await cleanupExpiredCaches();
        console.log('Cache cleanup completed');
      } catch (error) {
        console.error('Cache cleanup failed:', error);
      }
    }
  });

  /**
   * Perform cache cleanup on service worker startup
   * This ensures old cached data doesn't accumulate over time
   */
  (async () => {
    try {
      await cleanupExpiredCaches();
      const quota = await checkStorageQuota();
      console.log('Storage quota check:', {
        usage: `${(quota.usage / 1024 / 1024).toFixed(2)} MB`,
        quota: `${(quota.quota / 1024 / 1024).toFixed(2)} MB`,
        percentage: `${((quota.usage / quota.quota) * 100).toFixed(1)}%`,
        isNearLimit: quota.isNearLimit,
      });
    } catch (error) {
      console.error('Startup cleanup failed:', error);
    }
  })();

  /**
   * Register all message handlers
   */
  registerAllHandlers(registerMessageHandler);

  /**
   * Listen for storage changes and broadcast profile updates
   * This allows content scripts to react to configuration changes in real-time
   */
  browser.storage.onChanged.addListener((changes, areaName) => {
    console.log('Storage changed:', { areaName, keys: Object.keys(changes) });
    
    // Only process local storage changes
    if (areaName !== 'local') {
      return;
    }
    
    // Check if user profile changed
    if (changes['user_profile']) {
      const newProfile = changes['user_profile'].newValue as UserProfile;
      console.log('User profile updated, broadcasting to content scripts:', {
        englishLevel: newProfile?.englishLevel,
        llmProvider: newProfile?.llmProvider,
      });
      
      // Broadcast to all tabs
      browser.tabs.query({}).then(tabs => {
        tabs.forEach(tab => {
          if (tab.id && tab.url?.includes('youtube.com/watch')) {
            browser.tabs.sendMessage(tab.id, {
              type: MessageType.USER_PROFILE_RESPONSE,
              profile: newProfile,
            }).catch(error => {
              // Content script might not be ready yet, this is okay
              console.debug('Could not send profile update to tab:', tab.id, error.message);
            });
          }
        });
      });
    }
  });

  console.log('Message handlers registered successfully');
  console.log('Storage change listener registered successfully');
});
