/**
 * Options Page Script
 * 
 * Handles user settings and configuration for the YouTube Subtitle Enhancer extension.
 */

import './style.css';
import { getUserProfile, updateUserProfile } from '../../src/lib/storage-manager';
import type { UserProfile } from '../../src/types/index';

// Ensure browser global is available (polyfill for Chrome)
if (typeof window !== 'undefined' && typeof (window as any).browser === 'undefined') {
  (window as any).browser = chrome;
}

// DOM elements
let providerSelect: HTMLSelectElement;
let apiKeyInput: HTMLInputElement;
let toggleKeyBtn: HTMLButtonElement;
let modelInput: HTMLInputElement;
let levelRadios: NodeListOf<HTMLInputElement>;
let fontSizeInput: HTMLInputElement;
let saveBtn: HTMLButtonElement;
let resetBtn: HTMLButtonElement;
let statusDiv: HTMLDivElement;

/**
 * Initialize the options page
 */
async function init(): Promise<void> {
  console.log('=== Options page initializing ===');
  console.log('chrome API available:', typeof chrome !== 'undefined');
  console.log('chrome.storage available:', typeof chrome?.storage !== 'undefined');
  
  // Get DOM elements
  providerSelect = document.getElementById('llm-provider') as HTMLSelectElement;
  apiKeyInput = document.getElementById('api-key') as HTMLInputElement;
  toggleKeyBtn = document.getElementById('toggle-key') as HTMLButtonElement;
  modelInput = document.getElementById('llm-model') as HTMLInputElement;
  levelRadios = document.querySelectorAll('input[name="level"]') as NodeListOf<HTMLInputElement>;
  fontSizeInput = document.getElementById('font-size') as HTMLInputElement;
  saveBtn = document.getElementById('save-settings') as HTMLButtonElement;
  resetBtn = document.getElementById('reset-settings') as HTMLButtonElement;
  statusDiv = document.getElementById('status') as HTMLDivElement;
  
  // Check if all elements are found
  const elements = {
    providerSelect, apiKeyInput, toggleKeyBtn, modelInput,
    levelRadios, fontSizeInput, saveBtn, resetBtn, statusDiv
  };
  
  console.log('DOM elements found:', Object.entries(elements).map(([k, v]) => 
    `${k}: ${v ? '✓' : '✗'}`
  ).join(', '));
  
  if (!providerSelect || !apiKeyInput || !toggleKeyBtn || !modelInput || 
      !levelRadios || !fontSizeInput || !saveBtn || !resetBtn || !statusDiv) {
    console.error('❌ Some DOM elements not found!');
    return;
  }
  
  // Load current settings
  try {
    await loadSettings();
  } catch (error) {
    console.error('❌ Failed to load settings during init:', error);
    showStatus('❌ Failed to load settings: ' + (error as Error).message, 'error', false);
  }
  
  // Setup event listeners
  setupEventListeners();
  
  console.log('=== Options page initialized successfully ===');
}

/**
 * Load current settings from storage
 */
async function loadSettings(): Promise<void> {
  try {
    console.log('Loading settings...');
    const profile = await getUserProfile();
    console.log('Profile loaded:', profile);
    
    // Load LLM settings
    providerSelect.value = profile.llmProvider;
    apiKeyInput.value = profile.llmApiKey || '';
    modelInput.value = profile.llmModel || '';
    
    // Load English level
    levelRadios.forEach(radio => {
      radio.checked = radio.value === profile.englishLevel;
    });
    
    // Load display settings
    fontSizeInput.value = String(profile.subtitleFontSize);
    
    // Show status based on API key
    if (profile.llmApiKey) {
      showStatus('✅ Settings loaded - API Key is configured', 'success', true);
    } else {
      showStatus('⚠️ Please configure your API Key', 'warning', true);
    }
    
    console.log('Settings loaded successfully');
  } catch (error) {
    console.error('Failed to load settings:', error);
    showStatus('❌ Failed to load settings', 'error', false);
  }
}

/**
 * Save settings to storage
 */
async function saveSettings(): Promise<void> {
  try {
    console.log('Saving settings...');
    
    // Get selected level
    let selectedLevel: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
    levelRadios.forEach(radio => {
      if (radio.checked) {
        selectedLevel = radio.value as typeof selectedLevel;
      }
    });
    
    // Prepare updates
    const updates: Partial<UserProfile> = {
      llmProvider: providerSelect.value as 'openai' | 'claude' | 'deepseek',
      llmApiKey: apiKeyInput.value.trim(),
      llmModel: modelInput.value.trim() || undefined,
      englishLevel: selectedLevel,
      subtitleFontSize: parseInt(fontSizeInput.value, 10),
    };
    
    console.log('Updates to save:', updates);
    
    // Validate
    if (!updates.llmApiKey) {
      showStatus('⚠️ API Key is required', 'error', false);
      return;
    }
    
    // Save
    showStatus('⏳ Saving settings...', 'info', true);
    await updateUserProfile(updates);
    
    console.log('Settings saved successfully');
    showStatus('✅ Settings saved successfully!', 'success', false);
  } catch (error) {
    console.error('Failed to save settings:', error);
    showStatus('❌ Failed to save settings: ' + (error as Error).message, 'error', false);
  }
}

/**
 * Reset settings to defaults
 */
async function resetSettings(): Promise<void> {
  if (!confirm('Are you sure you want to reset all settings to defaults?')) {
    return;
  }
  
  try {
    // Reset to defaults
    await updateUserProfile({
      llmProvider: 'deepseek',
      llmApiKey: '',
      llmModel: 'deepseek-chat',
      englishLevel: 'intermediate',
      subtitleFontSize: 16,
    });
    
    // Reload settings
    await loadSettings();
    
    showStatus('✅ Settings reset to defaults', 'success', false);
  } catch (error) {
    console.error('Failed to reset settings:', error);
    showStatus('❌ Failed to reset settings', 'error', false);
  }
}

/**
 * Toggle API key visibility
 */
function toggleApiKeyVisibility(): void {
  if (apiKeyInput.type === 'password') {
    apiKeyInput.type = 'text';
    toggleKeyBtn.textContent = 'Hide';
  } else {
    apiKeyInput.type = 'password';
    toggleKeyBtn.textContent = 'Show';
  }
}

/**
 * Show status message
 * @param message - The status message to display
 * @param type - The type of status (success, error, warning, info)
 * @param persistent - If true, message stays visible longer
 */
function showStatus(message: string, type: 'success' | 'error' | 'warning' | 'info', persistent: boolean = false): void {
  console.log('Showing status:', message, type);
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.classList.remove('hidden');
  
  if (!persistent) {
    // Auto-hide after 5 seconds for non-persistent messages
    setTimeout(() => {
      statusDiv.classList.add('hidden');
    }, 5000);
  }
  // Persistent messages stay visible until next action
}

/**
 * Setup event listeners
 */
function setupEventListeners(): void {
  console.log('Setting up event listeners...');
  
  saveBtn.addEventListener('click', () => {
    console.log('Save button clicked');
    saveSettings();
  });
  
  resetBtn.addEventListener('click', () => {
    console.log('Reset button clicked');
    resetSettings();
  });
  
  toggleKeyBtn.addEventListener('click', () => {
    console.log('Toggle key button clicked');
    toggleApiKeyVisibility();
  });
  
  // Update model placeholder based on provider
  providerSelect.addEventListener('change', () => {
    const provider = providerSelect.value;
    let placeholder = '';
    
    switch (provider) {
      case 'deepseek':
        placeholder = 'deepseek-chat';
        break;
      case 'openai':
        placeholder = 'gpt-4o-mini';
        break;
      case 'claude':
        placeholder = 'claude-3-5-haiku-20241022';
        break;
    }
    
    modelInput.placeholder = placeholder;
  });
  
  // Hide persistent status when user starts editing
  apiKeyInput.addEventListener('input', () => {
    if (statusDiv.className.includes('info') || statusDiv.className.includes('warning')) {
      statusDiv.classList.add('hidden');
    }
  });
  
  console.log('Event listeners setup complete');
}

// Initialize when DOM is ready
console.log('Options script loaded, document.readyState:', document.readyState);

if (document.readyState === 'loading') {
  console.log('Waiting for DOMContentLoaded...');
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded fired');
    init();
  });
} else {
  console.log('DOM already loaded, initializing immediately');
  init();
}
