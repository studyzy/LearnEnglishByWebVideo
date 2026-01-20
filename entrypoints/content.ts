/**
 * Content Script for YouTube pages
 * 
 * This script is injected into YouTube watch pages and handles:
 * - Detecting video player and extracting video ID
 * - Fetching subtitles from background service worker
 * - Rendering enhanced subtitles with translations
 * - Handling SPA navigation for YouTube's dynamic page changes
 * 
 * @author YouTube Subtitle Enhancer Team
 * @since 0.1.0
 */

import '../src/content/content.css';
import { 
  initializePlayer, 
  requestSubtitles, 
  isWatchPage, 
  setupURLChangeDetection,
  clearPlayerState,
} from '../src/content/youtube-injector';
import {
  createSubtitleOverlay,
  injectOverlayIntoPlayer,
  startSubtitleSync,
  stopSubtitleSync,
  removeSubtitleOverlay,
  updateUserProfile,
} from '../src/content/subtitle-renderer';
import { getUserProfile } from '../src/lib/storage-manager';
import { MessageType } from '../src/types/index';

/**
 * Main initialization function
 * 
 * Called when content script loads and when navigating to a new video
 */
async function initializeExtension(): Promise<void> {
  console.log('YouTube Subtitle Enhancer: Initializing...');
  
  // Check if we're on a watch page
  if (!isWatchPage()) {
    console.log('Not on a watch page, skipping initialization');
    return;
  }
  
  try {
    // Get user profile
    const profile = await getUserProfile();
    console.log('User profile loaded:', {
      englishLevel: profile.englishLevel,
      llmProvider: profile.llmProvider,
      hasApiKey: !!profile.llmApiKey,
    });
    
    // Check if API key is configured
    if (!profile.llmApiKey) {
      console.warn('LLM API key not configured. Please set it in extension settings.');
      // Continue anyway - subtitles will work, but translations won't
    }
    
    // Initialize player
    const playerState = await initializePlayer();
    if (!playerState) {
      console.error('Failed to initialize player');
      return;
    }
    
    console.log('Player initialized:', {
      videoId: playerState.videoId,
      title: playerState.title,
    });
    
    // Request subtitles (new logic triggers capture via main world)
    console.log('Requesting subtitles via main world trigger...');
    const segments = await requestSubtitles(
      playerState.videoId
    );
    
    console.log(`Received ${segments.length} subtitle segments`);
    
    if (segments.length === 0) {
      console.warn('No subtitles available for this video');
      return;
    }
    
    // Create and inject subtitle overlay
    const overlay = createSubtitleOverlay();
    const injected = injectOverlayIntoPlayer(overlay);
    
    if (!injected) {
      console.error('Failed to inject overlay into player');
      return;
    }
    
    // Start subtitle synchronization
    startSubtitleSync(playerState.videoElement, segments, profile);
    
    console.log('YouTube Subtitle Enhancer: Initialized successfully');
  } catch (error) {
    console.error('Failed to initialize extension:', error);
  }
}

/**
 * Cleanup function
 * 
 * Called when navigating away from a video
 */
function cleanupExtension(): void {
  console.log('YouTube Subtitle Enhancer: Cleaning up...');
  
  stopSubtitleSync();
  removeSubtitleOverlay();
  clearPlayerState();
  
  console.log('YouTube Subtitle Enhancer: Cleaned up');
}

/**
 * Handle URL changes (YouTube SPA navigation)
 */
function handleURLChange(): void {
  console.log('URL changed, reinitializing...');
  
  // Cleanup existing state
  cleanupExtension();
  
  // Wait a bit for YouTube to load the new page
  setTimeout(() => {
    initializeExtension();
  }, 1000);
}

/**
 * Content script entry point
 */
export default defineContentScript({
  matches: ['*://www.youtube.com/watch*'],
  
  async main() {
    console.log('YouTube Subtitle Enhancer: Content script loaded', { 
      id: browser.runtime.id,
      url: window.location.href,
    });
    
    // Add a visible indicator that the extension is loaded
    const indicator = document.createElement('div');
    indicator.id = 'yse-loaded-indicator';
    indicator.textContent = '✓ 字幕增强插件已加载';
    Object.assign(indicator.style, {
      position: 'fixed',
      top: '10px',
      right: '10px',
      backgroundColor: '#4CAF50',
      color: 'white',
      padding: '10px 15px',
      borderRadius: '5px',
      zIndex: '999999',
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
    });
    document.body.appendChild(indicator);
    
    // Remove indicator after 3 seconds
    setTimeout(() => {
      indicator.style.transition = 'opacity 0.5s';
      indicator.style.opacity = '0';
      setTimeout(() => indicator.remove(), 500);
    }, 3000);
    
    // Setup URL change detection for SPA navigation
    setupURLChangeDetection(handleURLChange);
    
    // Initialize extension
    await initializeExtension();
    
    // Listen for messages from background (for profile updates, etc.)
    browser.runtime.onMessage.addListener((message) => {
      console.log('Message received in content script:', message.type);
      
      // Handle profile updates
      if (message.type === MessageType.USER_PROFILE_RESPONSE) {
        console.log('User profile updated, re-rendering subtitles...');
        
        // Update profile and re-render current subtitle (more efficient than full reload)
        updateUserProfile(message.profile);
      }
      
      return false;
    });
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      cleanupExtension();
    });
    
    console.log('YouTube Subtitle Enhancer: Ready');
  },
});
