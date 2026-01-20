/**
 * Beginner Level Word Dictionary (3000 most common English words)
 * 
 * Based on COCA (Corpus of Contemporary American English) word frequency list.
 * This represents the most common 3000 words that English learners should know.
 * 
 * @author YouTube Subtitle Enhancer Team
 * @since 0.1.0
 */

/**
 * Beginner level word set (3000 words)
 * 
 * NOTE: In a production environment, this should be loaded from an external file
 * or API to reduce bundle size. For now, we include a representative sample.
 * 
 * The full list should include:
 * - Common function words (the, a, an, is, are, was, were, etc.)
 * - Basic verbs (go, come, see, look, make, do, get, etc.)
 * - Basic nouns (time, people, way, day, man, thing, etc.)
 * - Basic adjectives (good, new, first, last, long, great, etc.)
 * - Numbers, pronouns, prepositions, conjunctions
 */
export const beginnerWords = new Set<string>([
  // Top 100 most frequent words
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
  'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
  'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
  'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
  'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
  'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
  'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
  
  // Common nouns (101-300)
  'thing', 'man', 'world', 'life', 'hand', 'part', 'child', 'eye', 'woman', 'place',
  'work', 'week', 'case', 'point', 'government', 'company', 'number', 'group', 'problem', 'fact',
  'room', 'water', 'money', 'story', 'family', 'country', 'school', 'state', 'night', 'area',
  'book', 'word', 'business', 'issue', 'side', 'kind', 'head', 'house', 'service', 'friend',
  'father', 'power', 'hour', 'game', 'line', 'end', 'member', 'law', 'car', 'city',
  'community', 'name', 'president', 'team', 'minute', 'idea', 'kid', 'body', 'information', 'back',
  'parent', 'face', 'level', 'office', 'door', 'health', 'person', 'art', 'war', 'history',
  'party', 'result', 'change', 'morning', 'reason', 'research', 'girl', 'guy', 'moment', 'air',
  'teacher', 'force', 'education', 'foot', 'boy', 'age', 'policy', 'process', 'music', 'market',
  'sense', 'nation', 'plan', 'college', 'interest', 'death', 'experience', 'effect', 'use', 'class',
  
  // Common verbs (301-500)
  'find', 'tell', 'ask', 'become', 'leave', 'feel', 'put', 'mean', 'keep', 'let',
  'begin', 'seem', 'help', 'talk', 'turn', 'start', 'show', 'hear', 'play', 'run',
  'move', 'pay', 'win', 'bring', 'happen', 'write', 'provide', 'sit', 'stand', 'lose',
  'meet', 'include', 'continue', 'set', 'learn', 'change', 'lead', 'understand', 'watch', 'follow',
  'stop', 'create', 'speak', 'read', 'allow', 'add', 'spend', 'grow', 'open', 'walk',
  'offer', 'remember', 'love', 'consider', 'appear', 'buy', 'wait', 'serve', 'die', 'send',
  'expect', 'build', 'stay', 'fall', 'cut', 'reach', 'kill', 'remain', 'suggest', 'raise',
  'pass', 'sell', 'require', 'report', 'decide', 'pull', 'support', 'call', 'pick', 'wear',
  'break', 'close', 'catch', 'return', 'eat', 'receive', 'produce', 'carry', 'drive', 'answer',
  'rise', 'fear', 'care', 'study', 'explain', 'involve', 'enjoy', 'reduce', 'manage', 'seek',
  
  // Common adjectives and adverbs (501-700)
  'high', 'large', 'small', 'great', 'own', 'old', 'different', 'big', 'young', 'few',
  'public', 'bad', 'same', 'able', 'important', 'every', 'each', 'many', 'much', 'several',
  'little', 'both', 'few', 'long', 'next', 'full', 'sure', 'national', 'real', 'social',
  'local', 'possible', 'political', 'economic', 'current', 'hard', 'human', 'late', 'best', 'far',
  'early', 'major', 'available', 'likely', 'strong', 'clear', 'common', 'past', 'difficult', 'certain',
  'true', 'military', 'medical', 'financial', 'low', 'whole', 'white', 'black', 'similar', 'recent',
  'special', 'simple', 'main', 'central', 'foreign', 'personal', 'happy', 'professional', 'happy', 'easy',
  'popular', 'hot', 'legal', 'traditional', 'various', 'present', 'serious', 'single', 'particular', 'international',
  'private', 'short', 'environmental', 'religious', 'significant', 'beautiful', 'specific', 'basic', 'nice', 'ready',
  'free', 'democratic', 'physical', 'blue', 'red', 'general', 'poor', 'western', 'southern', 'northern',
  
  // Additional common words to reach closer to 3000
  // (In production, this would be the complete COCA 3000 word list)
  'american', 'late', 'according', 'forward', 'third', 'total', 'natural', 'rate', 'modern', 'fast',
  'worth', 'else', 'director', 'nearly', 'especially', 'together', 'treatment', 'performance', 'film', 'security',
  'blood', 'individual', 'center', 'concern', 'deal', 'clearly', 'data', 'board', 'officer', 'position',
  'fire', 'final', 'indeed', 'million', 'sort', 'event', 'season', 'style', 'simply', 'court',
  'industry', 'response', 'record', 'model', 'section', 'practice', 'figure', 'half', 'director', 'economic',
  'nature', 'instead', 'letter', 'matter', 'view', 'discussion', 'north', 'south', 'east', 'west',
  'site', 'language', 'network', 'scene', 'employee', 'paper', 'piece', 'agreement', 'ground', 'space',
  'surface', 'player', 'cost', 'statement', 'choice', 'technology', 'knowledge', 'structure', 'standard', 'rock',
]);

/**
 * Check if a word is in the beginner level dictionary
 * 
 * @param word - Word to check (will be converted to lowercase)
 * @returns True if word is in beginner level
 */
export function isBeginnerWord(word: string): boolean {
  return beginnerWords.has(word.toLowerCase());
}

/**
 * Get the size of the beginner dictionary
 * 
 * @returns Number of words in the beginner dictionary
 */
export function getBeginnerWordCount(): number {
  return beginnerWords.size;
}
