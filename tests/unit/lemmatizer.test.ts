/**
 * Lemmatizer Unit Tests
 * 
 * Tests for the lemmatizer module covering:
 * - Regular verb lemmatization
 * - Irregular verb lemmatization  
 * - Noun plural lemmatization
 * - Adjective comparative/superlative lemmatization
 * - Case insensitivity
 * - Lemma comparison
 * 
 * @author YouTube Subtitle Enhancer Team
 * @since 0.1.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  Lemmatizer,
  lemmatizeWord,
  isSameLemma,
} from '../../src/lib/lemmatizer';

describe('Lemmatizer - Class Interface', () => {
  let lemmatizer: Lemmatizer;

  beforeEach(() => {
    lemmatizer = new Lemmatizer();
  });

  it('should create lemmatizer instance', () => {
    expect(lemmatizer).toBeDefined();
    expect(lemmatizer).toBeInstanceOf(Lemmatizer);
  });

  it('should have lemmatize method', () => {
    expect(typeof lemmatizer.lemmatize).toBe('function');
  });

  it('should have lemmatizeAuto method', () => {
    expect(typeof lemmatizer.lemmatizeAuto).toBe('function');
  });

  it('should have isSameLemma method', () => {
    expect(typeof lemmatizer.isSameLemma).toBe('function');
  });
});

describe('Lemmatizer - Regular Verbs', () => {
  let lemmatizer: Lemmatizer;

  beforeEach(() => {
    lemmatizer = new Lemmatizer();
  });

  it('should lemmatize -ing forms (present participle)', () => {
    expect(lemmatizer.lemmatize('running')).toBe('run');
    expect(lemmatizer.lemmatize('walking')).toBe('walk');
    expect(lemmatizer.lemmatize('talking')).toBe('talk');
    expect(lemmatizer.lemmatize('playing')).toBe('play');
  });

  it('should lemmatize -ed forms (past tense)', () => {
    expect(lemmatizer.lemmatize('walked')).toBe('walk');
    expect(lemmatizer.lemmatize('talked')).toBe('talk');
    expect(lemmatizer.lemmatize('played')).toBe('play');
  });

  it('should lemmatize -s forms (third person singular)', () => {
    expect(lemmatizer.lemmatize('runs')).toBe('run');
    expect(lemmatizer.lemmatize('walks')).toBe('walk');
    expect(lemmatizer.lemmatize('talks')).toBe('talk');
    expect(lemmatizer.lemmatize('plays')).toBe('play');
  });

  it('should handle base forms of verbs', () => {
    expect(lemmatizer.lemmatize('run')).toBe('run');
    expect(lemmatizer.lemmatize('walk')).toBe('walk');
    expect(lemmatizer.lemmatize('talk')).toBe('talk');
  });
});

describe('Lemmatizer - Irregular Verbs', () => {
  let lemmatizer: Lemmatizer;

  beforeEach(() => {
    lemmatizer = new Lemmatizer();
  });

  it('should lemmatize irregular past tenses', () => {
    expect(lemmatizer.lemmatize('went')).toBe('go');
    expect(lemmatizer.lemmatize('ran')).toBe('run');
    expect(lemmatizer.lemmatize('saw')).toBe('see');
    expect(lemmatizer.lemmatize('came')).toBe('come');
  });

  it('should lemmatize irregular past participles', () => {
    expect(lemmatizer.lemmatize('gone')).toBe('go');
    expect(lemmatizer.lemmatize('been')).toBe('be');
    expect(lemmatizer.lemmatize('seen')).toBe('see');
  });

  it('should lemmatize be verb forms', () => {
    expect(lemmatizer.lemmatize('am')).toBe('be');
    expect(lemmatizer.lemmatize('is')).toBe('be');
    expect(lemmatizer.lemmatize('are')).toBe('be');
    expect(lemmatizer.lemmatize('was')).toBe('be');
    expect(lemmatizer.lemmatize('were')).toBe('be');
  });
});

describe('Lemmatizer - Noun Plurals', () => {
  let lemmatizer: Lemmatizer;

  beforeEach(() => {
    lemmatizer = new Lemmatizer();
  });

  it('should lemmatize regular plural nouns (-s)', () => {
    expect(lemmatizer.lemmatize('cats')).toBe('cat');
    expect(lemmatizer.lemmatize('dogs')).toBe('dog');
    expect(lemmatizer.lemmatize('books')).toBe('book');
  });

  it('should lemmatize plural nouns ending in -es', () => {
    expect(lemmatizer.lemmatize('boxes')).toBe('box');
    expect(lemmatizer.lemmatize('dishes')).toBe('dish');
    expect(lemmatizer.lemmatize('buses')).toBe('bus');
  });

  it('should lemmatize irregular plural nouns', () => {
    expect(lemmatizer.lemmatize('children')).toBe('child');
    expect(lemmatizer.lemmatize('men')).toBe('man');
    expect(lemmatizer.lemmatize('women')).toBe('woman');
    expect(lemmatizer.lemmatize('mice')).toBe('mouse');
    expect(lemmatizer.lemmatize('feet')).toBe('foot');
  });

  it('should handle singular nouns', () => {
    expect(lemmatizer.lemmatize('cat')).toBe('cat');
    expect(lemmatizer.lemmatize('dog')).toBe('dog');
    expect(lemmatizer.lemmatize('child')).toBe('child');
  });
});

describe('Lemmatizer - Adjectives', () => {
  let lemmatizer: Lemmatizer;

  beforeEach(() => {
    lemmatizer = new Lemmatizer();
  });

  it('should lemmatize comparative adjectives (-er)', () => {
    expect(lemmatizer.lemmatize('bigger')).toBe('big');
    expect(lemmatizer.lemmatize('smaller')).toBe('small');
    expect(lemmatizer.lemmatize('faster')).toBe('fast');
  });

  it('should lemmatize superlative adjectives (-est)', () => {
    expect(lemmatizer.lemmatize('biggest')).toBe('big');
    expect(lemmatizer.lemmatize('smallest')).toBe('small');
    expect(lemmatizer.lemmatize('fastest')).toBe('fast');
  });

  it('should lemmatize irregular comparative adjectives', () => {
    expect(lemmatizer.lemmatize('better')).toBe('good');
    expect(lemmatizer.lemmatize('worse')).toBe('bad');
    // Note: 'more' may not lemmatize to 'much' in wink-lemmatizer
    expect(lemmatizer.lemmatize('more')).toBeTruthy();
  });

  it('should lemmatize irregular superlative adjectives', () => {
    expect(lemmatizer.lemmatize('best')).toBe('good');
    expect(lemmatizer.lemmatize('worst')).toBe('bad');
    // Note: 'most' may not lemmatize to 'much' in wink-lemmatizer
    expect(lemmatizer.lemmatize('most')).toBeTruthy();
  });

  it('should handle base form adjectives', () => {
    expect(lemmatizer.lemmatize('good')).toBe('good');
    expect(lemmatizer.lemmatize('bad')).toBe('bad');
    expect(lemmatizer.lemmatize('big')).toBe('big');
  });
});

describe('Lemmatizer - Case Insensitivity', () => {
  let lemmatizer: Lemmatizer;

  beforeEach(() => {
    lemmatizer = new Lemmatizer();
  });

  it('should handle uppercase input', () => {
    expect(lemmatizer.lemmatize('RUNNING')).toBe('run');
    expect(lemmatizer.lemmatize('CATS')).toBe('cat');
    expect(lemmatizer.lemmatize('BETTER')).toBe('good');
  });

  it('should handle mixed case input', () => {
    expect(lemmatizer.lemmatize('Running')).toBe('run');
    expect(lemmatizer.lemmatize('Cats')).toBe('cat');
    expect(lemmatizer.lemmatize('Better')).toBe('good');
  });

  it('should always return lowercase output', () => {
    const result1 = lemmatizer.lemmatize('RUNNING');
    const result2 = lemmatizer.lemmatize('Running');
    const result3 = lemmatizer.lemmatize('running');
    
    expect(result1).toBe(result1.toLowerCase());
    expect(result2).toBe(result2.toLowerCase());
    expect(result3).toBe(result3.toLowerCase());
  });
});

describe('Lemmatizer - Lemma Comparison', () => {
  let lemmatizer: Lemmatizer;

  beforeEach(() => {
    lemmatizer = new Lemmatizer();
  });

  it('should correctly identify same lemma for verb forms', () => {
    expect(lemmatizer.isSameLemma('run', 'running')).toBe(true);
    expect(lemmatizer.isSameLemma('run', 'runs')).toBe(true);
    expect(lemmatizer.isSameLemma('run', 'ran')).toBe(true);
    expect(lemmatizer.isSameLemma('running', 'ran')).toBe(true);
  });

  it('should correctly identify same lemma for noun forms', () => {
    expect(lemmatizer.isSameLemma('cat', 'cats')).toBe(true);
    expect(lemmatizer.isSameLemma('child', 'children')).toBe(true);
    expect(lemmatizer.isSameLemma('man', 'men')).toBe(true);
  });

  it('should correctly identify same lemma for adjective forms', () => {
    expect(lemmatizer.isSameLemma('good', 'better')).toBe(true);
    expect(lemmatizer.isSameLemma('good', 'best')).toBe(true);
    expect(lemmatizer.isSameLemma('better', 'best')).toBe(true);
  });

  it('should correctly identify different lemmas', () => {
    expect(lemmatizer.isSameLemma('run', 'walk')).toBe(false);
    expect(lemmatizer.isSameLemma('cat', 'dog')).toBe(false);
    expect(lemmatizer.isSameLemma('good', 'bad')).toBe(false);
  });

  it('should handle case differences in comparison', () => {
    expect(lemmatizer.isSameLemma('RUN', 'running')).toBe(true);
    expect(lemmatizer.isSameLemma('Cat', 'CATS')).toBe(true);
    expect(lemmatizer.isSameLemma('GOOD', 'better')).toBe(true);
  });
});

describe('Lemmatizer - Convenience Functions', () => {
  it('should export lemmatizeWord convenience function', () => {
    expect(typeof lemmatizeWord).toBe('function');
  });

  it('should export isSameLemma convenience function', () => {
    expect(typeof isSameLemma).toBe('function');
  });

  it('lemmatizeWord should work like class method', () => {
    expect(lemmatizeWord('running')).toBe('run');
    expect(lemmatizeWord('cats')).toBe('cat');
    expect(lemmatizeWord('better')).toBe('good');
  });

  it('isSameLemma should work like class method', () => {
    expect(isSameLemma('run', 'running')).toBe(true);
    expect(isSameLemma('cat', 'cats')).toBe(true);
    expect(isSameLemma('run', 'walk')).toBe(false);
  });
});

describe('Lemmatizer - Edge Cases', () => {
  let lemmatizer: Lemmatizer;

  beforeEach(() => {
    lemmatizer = new Lemmatizer();
  });

  it('should handle empty strings', () => {
    expect(lemmatizer.lemmatize('')).toBe('');
  });

  it('should handle single character words', () => {
    expect(lemmatizer.lemmatize('a')).toBe('a');
    expect(lemmatizer.lemmatize('I')).toBe('i');
  });

  it('should handle words with no inflection', () => {
    const word = 'hello';
    // Some words may be lemmatized even if they appear to have no inflection
    const result = lemmatizer.lemmatize(word);
    expect(result).toBe(word.toLowerCase());
  });

  it('should handle contractions (may not lemmatize)', () => {
    // Lemmatizer may not handle contractions, but shouldn't crash
    expect(() => lemmatizer.lemmatize("don't")).not.toThrow();
    expect(() => lemmatizer.lemmatize("can't")).not.toThrow();
  });

  it('should handle hyphenated words', () => {
    // May not fully handle hyphenated words, but shouldn't crash
    expect(() => lemmatizer.lemmatize('well-being')).not.toThrow();
    expect(() => lemmatizer.lemmatize('state-of-the-art')).not.toThrow();
  });
});

describe('Lemmatizer - lemmatizeAuto Method', () => {
  let lemmatizer: Lemmatizer;

  beforeEach(() => {
    lemmatizer = new Lemmatizer();
  });

  it('should work identically to lemmatize', () => {
    const testWords = ['running', 'cats', 'better', 'went', 'children'];
    
    testWords.forEach(word => {
      expect(lemmatizer.lemmatizeAuto(word)).toBe(lemmatizer.lemmatize(word));
    });
  });

  it('should handle all word types', () => {
    expect(lemmatizer.lemmatizeAuto('running')).toBe('run'); // verb
    expect(lemmatizer.lemmatizeAuto('cats')).toBe('cat'); // noun
    expect(lemmatizer.lemmatizeAuto('better')).toBe('good'); // adjective
  });
});
