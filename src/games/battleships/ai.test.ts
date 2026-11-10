import { describe, expect, it } from 'vitest';
import { createAiState, chooseAiShot, updateAiState } from '@/games/battleships/ai';
import { SIZE } from '@/games/battleships/rules';

describe('Battleships AI', () => {
  it('always chooses an untried cell', () => {
    const state = createAiState([]);
    const shot = chooseAiShot(state, 'professional');
    const [row, col] = shot;
    expect(shot).toHaveLength(2);
    expect(row).toBeDefined();
    expect(col).toBeDefined();
    expect(state.targetGrid[row ?? 0]?.[col ?? 0]).toBe('empty');
  });

  it('targets adjacent cells after a hit and clears the target after a sunk ship', () => {
    const state = createAiState([]);
    const afterHit = updateAiState(state, [4, 4], 'hit', false);
    const nextShot = chooseAiShot(afterHit, 'professional');
    const [nextRow, nextCol] = nextShot;
    expect(nextRow).toBeDefined();
    expect(nextCol).toBeDefined();
    expect(Math.abs((nextRow ?? 4) - 4) + Math.abs((nextCol ?? 4) - 4)).toBe(1);

    const afterSunk = updateAiState(afterHit, nextShot, 'hit', true);
    expect(afterSunk.hits).toEqual([]);
    expect(afterSunk.queue).toEqual([]);
    expect(afterSunk.targetGrid[4]?.[4]).toBe('hit');
    expect(afterSunk.targetGrid[nextRow ?? 0]?.[nextCol ?? 0]).toBe('hit');
  });

  it('stays within board bounds at an edge', () => {
    const state = updateAiState(createAiState([]), [0, 0], 'hit', false);
    const shot = chooseAiShot(state, 'professional');
    const [row, col] = shot;
    expect(row).toBeGreaterThanOrEqual(0);
    expect(col).toBeGreaterThanOrEqual(0);
    expect(row).toBeLessThan(SIZE);
    expect(col).toBeLessThan(SIZE);
  });
});
