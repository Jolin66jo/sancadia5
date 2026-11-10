import { describe, expect, it } from 'vitest';
import {
  consistentCandidates,
  gameStatus,
  generateSecret,
  getValidationError,
  scoreGuess,
  validateGuess,
} from '@/engine/codebreaker/core';
import type { CodebreakerConfig } from '@/engine/codebreaker/types';

const config: CodebreakerConfig = {
  symbols: 6,
  length: 4,
  allowRepeats: true,
  maxAttempts: 10,
};

describe('codebreaker core', () => {
  it('handles duplicate symbols correctly in exact and misplaced counts', () => {
    expect(scoreGuess([1, 1, 2, 3], [1, 2, 1, 1])).toEqual({ exact: 1, misplaced: 2 });
    expect(scoreGuess([1, 2, 3, 4], [1, 1, 1, 1])).toEqual({ exact: 1, misplaced: 0 });
    expect(scoreGuess([1, 2, 3, 4], [4, 3, 2, 1])).toEqual({ exact: 0, misplaced: 4 });
  });

  it('validates guesses by length and symbol range', () => {
    expect(validateGuess(config, [0, 1, 2, 3])).toBe(true);
    expect(validateGuess(config, [0, 1, 2])).toBe(false);
    expect(validateGuess(config, [0, 1, 2, 9])).toBe(false);
    expect(getValidationError(config, [0, 1, 2, 9])).toBe('Each symbol must be between 0 and 5.');
  });

  it('tracks game status and candidate filtering', () => {
    const history = [{ guess: [0, 1, 2, 3], feedback: { exact: 2, misplaced: 1 } }];
    expect(gameStatus(history, config)).toBe('playing');
    const candidates = consistentCandidates(config, history);
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates).toContainEqual([0, 1, 3, 4]);
    expect(candidates).not.toContainEqual([0, 1, 2, 3]);
    expect(
      gameStatus([{ guess: [0, 1, 2, 3], feedback: { exact: 4, misplaced: 0 } }], config),
    ).toBe('won');
    expect(
      gameStatus(
        Array.from({ length: config.maxAttempts }, () => ({
          guess: [0, 1, 2, 3],
          feedback: { exact: 0, misplaced: 0 },
        })),
        config,
      ),
    ).toBe('lost');
  });

  it('generates secrets with and without repeats', () => {
    const repeatAllowed = generateSecret({ ...config, allowRepeats: true }, () => 0.1);
    const uniqueOnly = generateSecret({ ...config, allowRepeats: false, symbols: 6 }, () => 0.1);

    expect(repeatAllowed).toHaveLength(4);
    expect(uniqueOnly).toHaveLength(4);
    expect(new Set(uniqueOnly).size).toBe(uniqueOnly.length);
  });

  it('rejects impossible configurations and invalid random samples', () => {
    expect(() => generateSecret({ ...config, allowRepeats: false, symbols: 2, length: 4 })).toThrow(
      'Code length cannot exceed the number of unique symbols.',
    );
    expect(() => generateSecret(config, () => 1)).toThrow('RNG must return a finite number');
  });
});
