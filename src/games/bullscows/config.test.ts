import { describe, expect, it } from 'vitest';
import { scoreGuess } from '@/engine/codebreaker/core';
import { bullsCowsConfigs } from '@/games/bullscows/config';

describe('Bulls and Cows config', () => {
  it('uses the requested lengths, attempts, and no-repeat code rules', () => {
    expect(bullsCowsConfigs).toMatchObject({
      beginner: { length: 4, maxAttempts: 12, hints: 3 },
      professional: { length: 4, maxAttempts: 10, hints: 2 },
      expert: { length: 5, maxAttempts: 10, hints: 1 },
    });
    expect(new Set([0, 1, 2, 3]).size).toBe(bullsCowsConfigs.beginner.length);
  });

  it('scores a complete game using bulls for exact and cows for misplaced digits', () => {
    const secret = [1, 2, 3, 4];
    expect(scoreGuess(secret, [1, 2, 3, 5])).toEqual({ exact: 3, misplaced: 0 });
    expect(scoreGuess(secret, [4, 3, 2, 1])).toEqual({ exact: 0, misplaced: 4 });
    expect(scoreGuess(secret, secret)).toEqual({ exact: 4, misplaced: 0 });
  });
});
