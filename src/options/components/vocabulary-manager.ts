/**
 * Vocabulary Manager Component
 * 
 * Handles the display and management of mastered and focus words.
 * Provides search, add, and delete functionality.
 * 
 * @module options/components/vocabulary-manager
 */

import { 
  getUserProfile, 
  removeMasteredWord, 
  removeFocusWord, 
  addMasteredWord,
  moveFocusToMastered,
  moveMasteredToFocus,
  updateUserProfile
} from '../../../src/lib/storage-manager';
import type { WordEntry, UserProfile } from '../../../src/types/index';
import { beginnerWords } from '../../../src/assets/dictionaries/beginner-words';
import { intermediateWords } from '../../../src/assets/dictionaries/intermediate-words';
import { advancedWords } from '../../../src/assets/dictionaries/advanced-words';
import { csvHandler } from './csv-handler';

export class VocabularyManager {
  private masteredList: HTMLElement | null = null;
  private focusList: HTMLElement | null = null;
  private searchInput: HTMLInputElement | null = null;
  private addInput: HTMLInputElement | null = null;
  private addBtn: HTMLButtonElement | null = null;
  private masteredCount: HTMLElement | null = null;
  private focusCount: HTMLElement | null = null;
  private exportBtn: HTMLButtonElement | null = null;
  private importTrigger: HTMLButtonElement | null = null;
  private importFile: HTMLInputElement | null = null;

  private allMasteredWords: WordEntry[] = [];
  private allFocusWords: WordEntry[] = [];
  private levelWords: string[] = [];
  private currentFilter: string = '';
  private displayLimit: number = 100;

  /**
   * Initialize the component
   */
  async init(): Promise<void> {
    console.log('Initializing VocabularyManager...');
    
    // Get DOM elements
    this.masteredList = document.getElementById('mastered-list');
    this.focusList = document.getElementById('focus-list');
    this.searchInput = document.getElementById('vocab-search') as HTMLInputElement;
    this.addInput = document.getElementById('vocab-add') as HTMLInputElement;
    this.addBtn = document.getElementById('vocab-add-btn') as HTMLButtonElement;
    this.masteredCount = document.getElementById('mastered-count');
    this.focusCount = document.getElementById('focus-count');
    this.exportBtn = document.getElementById('vocab-export') as HTMLButtonElement;
    this.importTrigger = document.getElementById('vocab-import-trigger') as HTMLButtonElement;
    this.importFile = document.getElementById('vocab-import-file') as HTMLInputElement;

    if (!this.masteredList || !this.focusList) {
      console.warn('Vocabulary list elements not found');
      return;
    }

    // Load initial data
    await this.refreshData();

    // Setup event listeners
    this.setupEventListeners();
    
    console.log('VocabularyManager initialized');
  }

  /**
   * Refresh data from storage
   */
  async refreshData(): Promise<void> {
    try {
      const profile = await getUserProfile();
      this.allMasteredWords = profile.masteredWords || [];
      this.allFocusWords = profile.focusWords || [];
      const ignoredWords = new Set((profile.ignoredLevelWords || []).map(w => w.toLowerCase()));
      
      // Load level-based words
      let rawLevelWords: string[] = [];
      if (profile.englishLevel === 'beginner') {
        rawLevelWords = Array.from(beginnerWords);
      } else if (profile.englishLevel === 'intermediate') {
        rawLevelWords = Array.from(intermediateWords);
      } else if (profile.englishLevel === 'advanced') {
        rawLevelWords = Array.from(advancedWords);
      }

      // Filter out ignored words
      this.levelWords = rawLevelWords.filter(w => !ignoredWords.has(w.toLowerCase()));

      this.render();
    } catch (error) {
      console.error('Failed to refresh vocabulary data:', error);
    }
  }

  /**
   * Setup event listeners for the component
   */
  private setupEventListeners(): void {
    // Search functionality
    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.currentFilter = (e.target as HTMLInputElement).value.toLowerCase();
        this.render();
      });
    }

    // Add word functionality
    if (this.addBtn && this.addInput) {
      const handleAdd = async () => {
        const word = this.addInput!.value.trim();
        if (word) {
          await addMasteredWord(word);
          this.addInput!.value = '';
          await this.refreshData();
        }
      };

      this.addBtn.addEventListener('click', handleAdd);
      this.addInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          handleAdd();
        }
      });
    }

    // Delegation for action buttons
    const handleAction = async (e: MouseEvent, listType: 'mastered' | 'focus') => {
      const target = e.target as HTMLElement;
      const word = target.getAttribute('data-word');
      if (!word) return;

      if (target.classList.contains('delete-btn')) {
        if (listType === 'mastered') {
          await removeMasteredWord(word);
        } else {
          await removeFocusWord(word);
        }
      } else if (target.classList.contains('move-btn')) {
        if (listType === 'mastered') {
          await moveMasteredToFocus(word);
        } else {
          await moveFocusToMastered(word);
        }
      }
      await this.refreshData();
    };

    if (this.masteredList) {
      this.masteredList.addEventListener('click', (e) => handleAction(e as MouseEvent, 'mastered'));
    }

    if (this.focusList) {
      this.focusList.addEventListener('click', (e) => handleAction(e as MouseEvent, 'focus'));
    }

    // CSV Export
    if (this.exportBtn) {
      this.exportBtn.addEventListener('click', async () => {
        try {
          const profile = await getUserProfile();
          const csv = csvHandler.exportVocabulary(profile);
          const timestamp = new Date().toISOString().split('T')[0];
          csvHandler.downloadFile(csv, `vocabulary-${timestamp}.csv`);
        } catch (error) {
          console.error('Export failed:', error);
          alert('Failed to export vocabulary');
        }
      });
    }

    // CSV Import
    if (this.importTrigger && this.importFile) {
      this.importTrigger.addEventListener('click', () => {
        this.importFile!.click();
      });

      this.importFile.addEventListener('change', async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
          const content = event.target?.result as string;
          if (!content) return;

          try {
            const { masteredWords, focusWords } = csvHandler.importVocabulary(content);
            const count = masteredWords.length + focusWords.length;
            
            if (confirm(`Import will OVERWRITE your current ${count} words. Continue?`)) {
              await updateUserProfile({ masteredWords, focusWords });
              await this.refreshData();
              alert('Vocabulary imported successfully!');
            }
          } catch (error) {
            console.error('Import failed:', error);
            alert('Failed to import vocabulary: ' + (error as Error).message);
          }
          
          // Reset file input
          this.importFile!.value = '';
        };
        reader.readAsText(file);
      });
    }
  }

  /**
   * Render the vocabulary lists
   */
  private render(): void {
    if (!this.masteredList || !this.focusList) return;

    // Filter personal mastered words
    const filteredPersonalMastered = this.allMasteredWords.filter(w => 
      w.word.toLowerCase().includes(this.currentFilter)
    );

    // Filter level words (exclude ones already in personal lists to avoid duplicates)
    const personalWordSet = new Set(this.allMasteredWords.map(w => w.word.toLowerCase()));
    const focusWordSet = new Set(this.allFocusWords.map(w => w.word.toLowerCase()));
    
    const filteredLevelWords = this.levelWords
      .filter(w => !personalWordSet.has(w.toLowerCase()) && !focusWordSet.has(w.toLowerCase()))
      .filter(w => w.toLowerCase().includes(this.currentFilter));

    // Combine all mastered for count
    const totalMasteredCount = filteredPersonalMastered.length + filteredLevelWords.length;
    if (this.masteredCount) this.masteredCount.textContent = String(totalMasteredCount);

    const filteredFocus = this.allFocusWords.filter(w => 
      w.word.toLowerCase().includes(this.currentFilter)
    );
    if (this.focusCount) this.focusCount.textContent = String(this.allFocusWords.length);

    // Render lists with limits for performance
    const masteredToRender = [
      ...filteredPersonalMastered.sort((a, b) => b.addedTime - a.addedTime),
      ...filteredLevelWords.sort().map(w => ({ word: w, addedTime: 0, source: 'level' as const }))
    ].slice(0, this.displayLimit);

    this.masteredList.innerHTML = this.renderListItems(masteredToRender as WordEntry[], 'mastered');
    this.focusList.innerHTML = this.renderListItems(filteredFocus, 'focus');
    
    if (totalMasteredCount > this.displayLimit && this.masteredList) {
      this.masteredList.innerHTML += `<li class="more-msg">... and ${totalMasteredCount - this.displayLimit} more words</li>`;
    }
  }

  /**
   * Render list items HTML
   */
  private renderListItems(words: WordEntry[], listType: 'mastered' | 'focus'): string {
    if (words.length === 0) {
      return '<li class="empty-msg">No words found</li>';
    }

    const moveIcon = listType === 'mastered' ? '🔍' : '✅';
    const moveTitle = listType === 'mastered' ? 'Move to Focus' : 'Move to Mastered';

    return words
      .map(w => `
        <li class="vocab-item ${w.source === 'level' ? 'level-word' : ''}">
          <span class="word-text">${this.escapeHtml(w.word)}</span>
          <span class="word-date">${w.addedTime > 0 ? new Date(w.addedTime).toLocaleDateString() : 'Level Word'}</span>
          <div class="item-actions">
            <button class="move-btn" data-word="${this.escapeHtml(w.word)}" title="${moveTitle}">${moveIcon}</button>
            <button class="delete-btn" data-word="${this.escapeHtml(w.word)}" title="Delete">&times;</button>
          </div>
        </li>
      `).join('');
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
