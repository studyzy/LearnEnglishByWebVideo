/**
 * CSV Handler Service
 * 
 * Handles exporting and importing vocabulary data in CSV format.
 * Integrates with PapaParse for robust CSV parsing and generation.
 * 
 * @module options/components/csv-handler
 * @author YouTube Subtitle Enhancer Team
 * @since 0.1.0
 */

import Papa from 'papaparse';
import type { WordEntry, UserProfile, CSVRow } from '../../types/index';

/**
 * CSV Processor class
 */
export class CSVHandler {
  /**
   * Exports vocabulary to a CSV string
   * 
   * @param profile - User profile containing mastered and focus words
   * @returns CSV string
   */
  exportVocabulary(profile: UserProfile): string {
    const data: CSVRow[] = [];

    // Add mastered words
    (profile.masteredWords || []).forEach(w => {
      data.push({
        type: 'mastered',
        word: w.word,
        addedTime: new Date(w.addedTime).toISOString()
      });
    });

    // Add focus words
    (profile.focusWords || []).forEach(w => {
      data.push({
        type: 'focus',
        word: w.word,
        addedTime: new Date(w.addedTime).toISOString()
      });
    });

    if (data.length === 0) {
      return 'type,word,addedTime';
    }

    return Papa.unparse(data);
  }

  /**
   * Imports vocabulary from a CSV string
   * 
   * @param csvData - Raw CSV string
   * @returns Object with parsed mastered and focus words
   * @throws Error if CSV format is invalid
   */
  importVocabulary(csvData: string): { masteredWords: WordEntry[], focusWords: WordEntry[] } {
    const results = Papa.parse<CSVRow>(csvData, {
      header: true,
      skipEmptyLines: true,
    });

    if (results.errors.length > 0) {
      throw new Error(`CSV Parsing failed: ${results.errors[0].message}`);
    }

    const masteredWords: WordEntry[] = [];
    const focusWords: WordEntry[] = [];

    results.data.forEach((row, index) => {
      // Basic validation
      if (!row.word || !row.type) {
        console.warn(`Skipping invalid row at index ${index}:`, row);
        return;
      }

      const word = row.word.trim().toLowerCase();
      const addedTime = row.addedTime ? new Date(row.addedTime).getTime() : Date.now();
      
      const entry: WordEntry = {
        word,
        addedTime: isNaN(addedTime) ? Date.now() : addedTime,
        source: 'manual'
      };

      if (row.type === 'mastered') {
        masteredWords.push(entry);
      } else if (row.type === 'focus') {
        focusWords.push(entry);
      }
    });

    return { masteredWords, focusWords };
  }

  /**
   * Triggers a file download in the browser
   * 
   * @param content - Text content to download
   * @param fileName - Target file name
   * @param contentType - MIME type
   */
  downloadFile(content: string, fileName: string, contentType: string = 'text/csv;charset=utf-8;'): void {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }
}

/**
 * Default instance for convenience
 */
export const csvHandler = new CSVHandler();
export default csvHandler;
