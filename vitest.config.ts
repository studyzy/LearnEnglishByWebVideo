/**
 * Vitest Configuration
 * 
 * This configuration sets up the testing environment for the YouTube Subtitle Enhancer extension.
 * It includes:
 * - 60% minimum coverage threshold (as per project constitution)
 * - Chrome API mocks via vitest-chrome
 * - jsdom environment for DOM testing
 * 
 * @author YouTube Subtitle Enhancer Team
 * @since 0.1.0
 */

import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    // Test environment
    environment: 'jsdom',
    
    // Setup files
    setupFiles: ['./tests/setup.ts'],
    
    // Globals (describe, it, expect, etc.)
    globals: true,
    
    // Coverage configuration - 60% minimum as per constitution
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      
      // Overall coverage thresholds (60% minimum)
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
      
      // Include only source files
      include: [
        'src/**/*.{ts,tsx}',
        'entrypoints/**/*.{ts,tsx}',
      ],
      
      // Exclude test files and type definitions
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/*.d.ts',
        '.wxt/',
        'dist/',
        '.output/',
      ],
    },
    
    // Test include patterns
    include: [
      'tests/unit/**/*.test.{ts,tsx}',
      'tests/integration/**/*.test.{ts,tsx}',
      'tests/e2e/**/*.test.{ts,tsx}',
    ],
    
    // Test timeout (10 seconds)
    testTimeout: 10000,
  },
  
  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '~': resolve(__dirname, '.'),
    },
  },
});
