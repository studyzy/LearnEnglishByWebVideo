/**
 * WXT Configuration
 * 
 * This configuration defines the Chrome extension manifest and build settings.
 * It follows Manifest V3 specifications as required by the project constitution.
 * 
 * @author YouTube Subtitle Enhancer Team
 * @since 0.1.0
 */

import { defineConfig } from 'wxt';

export default defineConfig({
  // Output directory
  outDir: '.output',
  
  // Vite configuration for path aliases
  vite: () => ({
    resolve: {
      alias: [
        { find: /^@\/(.*)$/, replacement: '/src/$1' },
      ],
    },
  }),
  
  // Manifest configuration
  manifest: {
    name: 'YouTube Subtitle Enhancer',
    version: '0.1.0',
    description: 'Enhance YouTube subtitles with Chinese translations for English learners',
    
    // Minimum Chrome version
    minimum_chrome_version: '88',
    
    // Default locale
    default_locale: 'en',
    
    // Permissions
    permissions: [
      'storage',          // For storing user preferences and vocabulary
      'scripting',        // For injecting content scripts
    ],
    
    // Host permissions (YouTube only)
    host_permissions: [
      '*://www.youtube.com/*',
      'https://www.youtube.com/*',
    ],
    
    // Optional permissions (can be requested later)
    optional_permissions: [],
    
    // Background service worker
    // Note: WXT automatically configures this from entrypoints/background/
    
    // Content scripts
    // Note: WXT automatically configures this from entrypoints/content.ts with matches
    
    // Web accessible resources
    web_accessible_resources: [
      {
        resources: ['assets/*'],
        matches: ['*://www.youtube.com/*'],
      },
    ],
    
    // Icons (to be added in Phase 7)
    // icons: {
    //   16: 'assets/icons/icon-16.png',
    //   48: 'assets/icons/icon-48.png',
    //   128: 'assets/icons/icon-128.png',
    // },
    
    // Action (popup)
    action: {
      default_title: 'YouTube Subtitle Enhancer',
      // default_icon: 'assets/icons/icon-48.png', // To be added in Phase 7
    },
    
    // Options page
    options_ui: {
      page: 'options.html',
      open_in_tab: true,
    },
    
    // Content Security Policy (strict as per constitution)
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self'",
    },
  },
  
  // Development options
  dev: {
    // Auto-reload on changes (removed full command that was causing error)
  },
  
  // Build options
  build: {
    // Source maps for debugging
    sourcemap: true,
    
    // Target browsers
    target: 'chrome',
  },
});
