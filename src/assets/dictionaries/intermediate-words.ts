/**
 * Intermediate Level Word Dictionary (6000 most common English words)
 * 
 * Based on COCA (Corpus of Contemporary American English) word frequency list.
 * Includes beginner words (3000) + additional 3000 intermediate words.
 * 
 * @author YouTube Subtitle Enhancer Team
 * @since 0.1.0
 */

import { beginnerWords } from './beginner-words';

/**
 * Additional intermediate level words (3001-6000)
 * 
 * NOTE: In production, load from external file/API to reduce bundle size.
 * This is a representative sample of intermediate vocabulary.
 */
const intermediateAdditionalWords = new Set<string>([
  // Academic and formal vocabulary
  'analyze', 'approach', 'assess', 'assume', 'authority', 'benefit', 'concept', 'consist',
  'constitute', 'context', 'contract', 'create', 'data', 'define', 'derive', 'distribute',
  'economy', 'environment', 'establish', 'estimate', 'evidence', 'export', 'factor', 'finance',
  'formula', 'function', 'identify', 'income', 'indicate', 'individual', 'interpret', 'involve',
  'issue', 'labor', 'legal', 'legislate', 'major', 'method', 'occur', 'percent', 'period',
  'policy', 'principle', 'proceed', 'process', 'require', 'research', 'respond', 'role',
  'section', 'sector', 'significant', 'similar', 'source', 'specific', 'structure', 'theory',
  'variable', 'achieve', 'acquire', 'administrate', 'affect', 'appropriate', 'aspect', 'assist',
  'category', 'chapter', 'commission', 'community', 'complex', 'compute', 'conclude', 'conduct',
  'consequent', 'considerable', 'consume', 'credit', 'culture', 'design', 'distinct', 'element',
  
  // Technology and modern terms
  'computer', 'software', 'hardware', 'program', 'file', 'document', 'email', 'website',
  'internet', 'online', 'download', 'upload', 'digital', 'virtual', 'database', 'network',
  'server', 'client', 'browser', 'search', 'click', 'interface', 'application', 'mobile',
  'device', 'screen', 'keyboard', 'mouse', 'password', 'username', 'account', 'profile',
  
  // Business and professional
  'management', 'manager', 'executive', 'employee', 'employer', 'colleague', 'client', 'customer',
  'department', 'project', 'budget', 'profit', 'revenue', 'expense', 'investment', 'asset',
  'resource', 'strategy', 'objective', 'target', 'deadline', 'schedule', 'meeting', 'presentation',
  'negotiate', 'proposal', 'contract', 'agreement', 'partnership', 'cooperation', 'competition',
  
  // Scientific terms
  'experiment', 'hypothesis', 'theory', 'observation', 'measurement', 'analysis', 'conclusion',
  'evidence', 'statistics', 'probability', 'variable', 'constant', 'equation', 'formula',
  'molecule', 'atom', 'element', 'compound', 'reaction', 'energy', 'force', 'motion',
  
  // Social and cultural
  'culture', 'society', 'tradition', 'custom', 'belief', 'value', 'norm', 'identity',
  'diversity', 'equality', 'justice', 'freedom', 'democracy', 'authority', 'responsibility',
  'community', 'organization', 'institution', 'association', 'movement', 'campaign',
  
  // More common intermediate verbs
  'accomplish', 'acknowledge', 'adapt', 'adopt', 'advocate', 'allocate', 'alter', 'anticipate',
  'appreciate', 'arise', 'assert', 'assign', 'assure', 'attach', 'attain', 'attribute',
  'characterize', 'cite', 'clarify', 'coincide', 'collapse', 'commence', 'comment', 'commit',
  'communicate', 'compensate', 'compile', 'complement', 'conceive', 'concentrate', 'confer',
  'confine', 'confirm', 'conform', 'consent', 'conserve', 'consolidate', 'constrain', 'construct',
  'consult', 'contact', 'contemplate', 'contradict', 'contrast', 'contribute', 'controversy',
  'convert', 'convey', 'convince', 'cooperate', 'coordinate', 'correspond', 'critique',
  
  // Intermediate adjectives and adverbs
  'abstract', 'academic', 'accurate', 'adequate', 'adjacent', 'aggregate', 'alternative', 'ambiguous',
  'apparent', 'approximate', 'arbitrary', 'automatic', 'aware', 'capable', 'chronic', 'civil',
  'classic', 'coincide', 'coherent', 'colonial', 'compatible', 'compensate', 'complementary',
  'comprehensive', 'concurrent', 'confined', 'consecutive', 'considerable', 'consistent', 'constant',
  'contemporary', 'controversial', 'conventional', 'cooperative', 'core', 'corporate', 'corresponding',
  'criteria', 'crucial', 'cultural', 'cumulative', 'discrete', 'dominant', 'dramatic', 'dynamic',
  'empirical', 'enormous', 'equivalent', 'ethical', 'evident', 'explicit', 'external', 'federal',
  'fundamental', 'global', 'hypothetical', 'identical', 'ideological', 'implicit', 'initial',
  'innovative', 'integral', 'intense', 'intermediate', 'internal', 'logical', 'marginal',
  'mature', 'mechanical', 'mental', 'minimal', 'negative', 'neutral', 'normal', 'obvious',
  'occupational', 'parallel', 'passive', 'persistent', 'potential', 'preliminary', 'primary',
  'prime', 'principal', 'prior', 'professional', 'progressive', 'prominent', 'psychological',
  'radical', 'random', 'rational', 'regardless', 'regional', 'relative', 'relevant', 'reluctant',
  'reverse', 'rigid', 'rural', 'secondary', 'secure', 'selective', 'simultaneous', 'sole',
  'sophisticated', 'stable', 'statistical', 'straightforward', 'subsequent', 'substantial', 'subtle',
  'successive', 'sufficient', 'supreme', 'symbolic', 'temporary', 'terminal', 'theoretical',
  'thereby', 'traditional', 'transition', 'ultimate', 'underlying', 'unique', 'universal',
  'urban', 'valid', 'voluntary', 'whereas', 'widespread',
]);

/**
 * Complete intermediate word set (beginner + intermediate additional)
 */
export const intermediateWords = new Set<string>([
  ...Array.from(beginnerWords),
  ...Array.from(intermediateAdditionalWords),
]);

/**
 * Check if a word is in the intermediate level dictionary
 * 
 * @param word - Word to check (will be converted to lowercase)
 * @returns True if word is in intermediate level (includes beginner words)
 */
export function isIntermediateWord(word: string): boolean {
  return intermediateWords.has(word.toLowerCase());
}

/**
 * Get the size of the intermediate dictionary
 * 
 * @returns Number of words in the intermediate dictionary
 */
export function getIntermediateWordCount(): number {
  return intermediateWords.size;
}
