import { describe, expect, it } from 'vitest';
import { beginnerWords, expertWords, professionalWords } from '@/games/hangman/words';
import { guessLetter, maskedWord, remainingLetters, status } from '@/games/hangman/rules';

describe('Hangman rules', () => {
  it('ignores repeated guesses and is case-insensitive', () => {
    const first = guessLetter(
      { word: 'planet', guessedLetters: [], wrongCount: 0, maxWrong: 6 },
      'P',
    );
    const repeated = guessLetter(first, 'p');
    expect(first.guessedLetters).toEqual(['p']);
    expect(repeated).toBe(first);
  });

  it('masks words and reports wins and losses', () => {
    const state = { word: 'cat', guessedLetters: ['c', 'a'], wrongCount: 0, maxWrong: 6 };
    expect(maskedWord(state)).toBe('c a _');
    expect(status({ ...state, guessedLetters: ['c', 'a', 't'] })).toBe('won');
    expect(status({ ...state, wrongCount: 6 })).toBe('lost');
    expect(remainingLetters(state)).not.toContain('a');
  });

  it('bundled word lists are unique and match their difficulty rules', () => {
    const lists = [
      { name: 'beginner', words: beginnerWords, min: 4, max: 6 },
      { name: 'professional', words: professionalWords, min: 6, max: 9 },
      { name: 'expert', words: expertWords, min: 8, max: 12 },
    ];

    for (const list of lists) {
      expect(new Set(list.words).size, `${list.name} words should be unique`).toBe(
        list.words.length,
      );
      for (const word of list.words) {
        expect(word).toMatch(/^[a-z]+$/);
        expect(word.length).toBeGreaterThanOrEqual(list.min);
        expect(word.length).toBeLessThanOrEqual(list.max);
      }
    }
  });
});
