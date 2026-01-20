/**
 * Advanced Level Word Dictionary (10000 most common English words)
 * 
 * Based on COCA (Corpus of Contemporary American English) word frequency list.
 * Includes intermediate words (6000) + additional 4000 advanced words.
 * 
 * @author YouTube Subtitle Enhancer Team
 * @since 0.1.0
 */

import { intermediateWords } from './intermediate-words';

/**
 * Additional advanced level words (6001-10000)
 * 
 * NOTE: In production, load from external file/API to reduce bundle size.
 * This is a representative sample of advanced vocabulary.
 */
const advancedAdditionalWords = new Set<string>([
  // Advanced academic and technical vocabulary
  'abandon', 'abbreviate', 'abolish', 'absorb', 'abstract', 'absurd', 'abundance', 'accelerate',
  'accentuate', 'accessible', 'accommodate', 'accompany', 'accumulate', 'accuracy', 'accuse',
  'adjacent', 'administer', 'admire', 'adverse', 'aesthetic', 'affiliate', 'affirm', 'aggregate',
  'aggressive', 'agony', 'albeit', 'allocate', 'allude', 'alternate', 'ambiguous', 'amendment',
  'ample', 'analogous', 'ancestor', 'anticipate', 'apparatus', 'append', 'appraisal', 'arbitrary',
  'architecture', 'aristocrat', 'arouse', 'array', 'articulate', 'ascend', 'aspire', 'assemble',
  'assertive', 'asteroid', 'asylum', 'atomic', 'atrocity', 'attire', 'augment', 'austere',
  'authentic', 'authorize', 'autobiography', 'automatic', 'autonomous', 'avalanche', 'awkward',
  
  // Sophisticated verbs
  'baffle', 'banish', 'barren', 'behold', 'benevolent', 'bewilder', 'bilateral', 'bizarre',
  'blasphemy', 'bolster', 'bondage', 'boycott', 'brevity', 'brink', 'brittle', 'bureaucracy',
  'burgeon', 'bypass', 'calamity', 'calibrate', 'candid', 'canvas', 'capacity', 'capitalize',
  'captivate', 'caricature', 'catastrophe', 'catalyst', 'causality', 'cavalry', 'ceaseless',
  'celestial', 'censorship', 'certify', 'chaos', 'chronicle', 'circumference', 'circumscribe',
  'cite', 'clarity', 'clergy', 'coalesce', 'coerce', 'cognition', 'cognitive', 'coherence',
  'coincidence', 'collaborate', 'collateral', 'collective', 'collision', 'colonize', 'colossal',
  'commemorate', 'commence', 'commend', 'commodity', 'commonplace', 'communal', 'compact',
  'comparable', 'compartment', 'compassion', 'compel', 'compensate', 'compile', 'complacent',
  'complement', 'compliance', 'complicate', 'component', 'compose', 'composite', 'compound',
  'comprehend', 'compress', 'comprise', 'compromise', 'compulsion', 'conceal', 'concede',
  'conceivable', 'concentric', 'conception', 'concise', 'conclusive', 'concrete', 'condemn',
  'condense', 'conducive', 'confer', 'confide', 'configure', 'confine', 'confiscate', 'conform',
  'confront', 'congestion', 'congregation', 'conjecture', 'conjunction', 'conquer', 'conscience',
  'conscientious', 'consecutive', 'consensus', 'consent', 'consequent', 'conservative', 'consolidate',
  'conspicuous', 'conspiracy', 'constrain', 'constraint', 'constrict', 'consult', 'consume',
  'contemplate', 'contempt', 'contend', 'contentious', 'contingency', 'continual', 'contradict',
  'contradiction', 'contrary', 'contribution', 'contrive', 'controversy', 'convene', 'converge',
  'conversely', 'convert', 'convey', 'convict', 'conviction', 'convince', 'cooperate', 'coordinate',
  
  // Advanced nouns and concepts
  'correlation', 'correspondence', 'corruption', 'cosmopolitan', 'counsel', 'counterpart',
  'courtesy', 'covenant', 'covert', 'credibility', 'creed', 'criterion', 'critique', 'crude',
  'crusade', 'culminate', 'cultivate', 'cumulative', 'curiosity', 'curriculum', 'custody',
  'cynical', 'debris', 'debut', 'decadence', 'deceive', 'decipher', 'declaration', 'decline',
  'decompose', 'decorate', 'decree', 'dedicate', 'deduce', 'deem', 'defect', 'defer',
  'defiance', 'deficiency', 'deficit', 'definitive', 'deflect', 'deforestation', 'defy',
  'degenerate', 'degradation', 'deliberate', 'delicate', 'delineate', 'delinquent', 'democracy',
  'demolish', 'demon', 'demonstrate', 'denote', 'denounce', 'depict', 'deplete', 'deploy',
  'deport', 'depose', 'depreciate', 'deprive', 'deputy', 'derivative', 'descend', 'descendant',
  'designate', 'despair', 'desperate', 'despise', 'destitute', 'destruction', 'detach', 'detect',
  'detention', 'deteriorate', 'deviate', 'device', 'devise', 'devote', 'diagnose', 'dialect',
  'dictate', 'differentiate', 'diffuse', 'dilemma', 'diligent', 'dimension', 'diminish',
  'diplomacy', 'discard', 'discern', 'discipline', 'disclose', 'discourse', 'discrete',
  'discretion', 'discriminate', 'disdain', 'disgrace', 'disintegrate', 'dismantle', 'dismay',
  'dismiss', 'disparity', 'dispatch', 'disperse', 'displace', 'disposal', 'dispose', 'disproportionate',
  'dispute', 'disregard', 'disrupt', 'dissent', 'dissolve', 'distort', 'distract', 'distribute',
  'diverse', 'divert', 'divine', 'doctrine', 'domain', 'domestic', 'dominate', 'dormant',
  'drainage', 'drastic', 'drawback', 'duplicate', 'duration', 'dwell', 'dynamic', 'dynasty',
  
  // Advanced adjectives
  'eccentric', 'eclipse', 'ecology', 'ecosystem', 'ecstasy', 'edict', 'editorial', 'elaborate',
  'elapse', 'elastic', 'elicit', 'eligible', 'eliminate', 'elite', 'eloquent', 'elucidate',
  'elusive', 'emanate', 'embark', 'embed', 'embody', 'embrace', 'emerge', 'emigrate',
  'emission', 'emphasize', 'empire', 'empirical', 'emulate', 'enact', 'encompass', 'encounter',
  'endorse', 'endow', 'endurance', 'enforce', 'engage', 'enhance', 'enigma', 'enlighten',
  'enormous', 'enrich', 'ensemble', 'ensure', 'entail', 'enterprise', 'entertain', 'entity',
  'entrepreneur', 'enumerate', 'envisage', 'epoch', 'equator', 'equilibrium', 'equip', 'equivalent',
  'eradicate', 'erect', 'erode', 'erratic', 'erupt', 'escalate', 'essence', 'eternal',
  'ethical', 'ethnic', 'etiquette', 'evacuate', 'evade', 'evaporate', 'eventually', 'evident',
  'evoke', 'evolution', 'evolve', 'exacerbate', 'exaggerate', 'exalted', 'exceed', 'excel',
  'excerpt', 'excess', 'exclude', 'excursion', 'execute', 'exemplify', 'exempt', 'exert',
  'exhaust', 'exhibit', 'exile', 'exodus', 'exotic', 'expand', 'expedition', 'expel',
  'expenditure', 'expertise', 'expire', 'explicit', 'exploit', 'exponential', 'expose', 'exposition',
  'exposure', 'expound', 'exquisite', 'extend', 'extensive', 'extent', 'exterminate', 'extinct',
  'extinguish', 'extort', 'extract', 'extraordinary', 'extrapolate', 'extravagant', 'extreme',
  'extricate', 'exuberant', 'fabricate', 'facade', 'facilitate', 'faction', 'faculty', 'famine',
  'fanatic', 'fantasy', 'fascinate', 'fatigue', 'fauna', 'feasible', 'feat', 'federation',
  'feeble', 'fertile', 'fervent', 'feudal', 'fiber', 'fiction', 'fidelity', 'fierce',
  'figurative', 'finite', 'fiscal', 'flaw', 'flee', 'flexible', 'flourish', 'fluctuate',
  'fluent', 'fluid', 'folklore', 'forbid', 'forecast', 'foresee', 'forge', 'formidable',
  'formulate', 'forsake', 'fortify', 'fortunate', 'fossil', 'foster', 'foundation', 'fracture',
  'fragile', 'fragment', 'franchise', 'fraud', 'freight', 'friction', 'frontier', 'frugal',
  'frustrate', 'fuel', 'fulfill', 'function', 'fundamental', 'furious', 'furnish', 'fusion',
]);

/**
 * Complete advanced word set (intermediate + advanced additional)
 */
export const advancedWords = new Set<string>([
  ...Array.from(intermediateWords),
  ...Array.from(advancedAdditionalWords),
]);

/**
 * Check if a word is in the advanced level dictionary
 * 
 * @param word - Word to check (will be converted to lowercase)
 * @returns True if word is in advanced level (includes beginner and intermediate words)
 */
export function isAdvancedWord(word: string): boolean {
  return advancedWords.has(word.toLowerCase());
}

/**
 * Get the size of the advanced dictionary
 * 
 * @returns Number of words in the advanced dictionary
 */
export function getAdvancedWordCount(): number {
  return advancedWords.size;
}
