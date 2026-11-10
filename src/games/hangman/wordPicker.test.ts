import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { beginnerWords } from '@/games/hangman/words';
import { pickHangmanWord } from '@/games/hangman/wordPicker';

describe('pickHangmanWord', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not repeat a word until the bundled list is exhausted', () => {
    const selected = Array.from({ length: beginnerWords.length }, () =>
      pickHangmanWord('beginner'),
    );
    expect(new Set(selected).size).toBe(beginnerWords.length);
    expect(pickHangmanWord('beginner')).toBe(beginnerWords[0]);
  });
});
