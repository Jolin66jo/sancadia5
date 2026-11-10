import { describe, expect, it } from 'vitest';
import type { Player } from '@/engine/types';
import {
  SIZE,
  candidateMovesFor,
  findWin,
  gomoku,
  type Cell,
  type GomokuState,
} from '@/games/gomoku/rules';

function emptyBoard(): Cell[][] {
  return Array.from({ length: SIZE }, () => Array<Cell>(SIZE).fill(null));
}

function stateWith(board: Cell[][], turn: Player = 0): GomokuState {
  return { board, turn };
}

function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

describe('win detection', () => {
  it.each([
    ['horizontal', 7, 4, 0, 1],
    ['vertical', 4, 7, 1, 0],
    ['down-right diagonal', 3, 3, 1, 1],
    ['down-left diagonal', 3, 7, 1, -1],
  ])('detects five in a row %s', (_direction, row, col, dRow, dCol) => {
    const board = emptyBoard();
    for (let index = 0; index < 5; index++) {
      const targetRow = board[row + dRow * index];
      if (targetRow) targetRow[col + dCol * index] = 1;
    }
    expect(findWin(board)?.owner).toBe(1);
    expect(gomoku.winner(stateWith(board))).toBe(1);
    expect(gomoku.isTerminal(stateWith(board))).toBe(true);
  });

  it('accepts a run longer than five and returns a five-cell winning line', () => {
    const board = emptyBoard();
    const row7 = board[7];
    if (row7) {
      for (let col = 3; col < 9; col++) row7[col] = 0;
    }
    expect(findWin(board)?.cells).toHaveLength(5);
  });

  it('reports a draw when the full board has no five in a row', () => {
    const pattern = ['0001', '0001', '0100', '1011'];
    const board = Array.from({ length: SIZE }, (_, row) =>
      Array.from({ length: SIZE }, (_, col) => {
        const rowPattern = pattern[row % 4];
        const cell = rowPattern?.[col % 4] ?? 0;
        return Number(cell) as Player;
      }),
    );
    const state = stateWith(board);
    expect(findWin(board)).toBeNull();
    expect(gomoku.isTerminal(state)).toBe(true);
    expect(gomoku.winner(state)).toBe('draw');
  });
});

describe('moves and draws', () => {
  it('starts with the centre intersection as the only AI candidate', () => {
    expect(candidateMovesFor(gomoku.initialState())).toEqual([{ row: 7, col: 7 }]);
  });

  it('keeps AI candidates within two squares of an existing stone', () => {
    const board = emptyBoard();
    const row7 = board[7];
    if (row7) row7[7] = 0;
    const candidates = candidateMovesFor(stateWith(board));
    expect(candidates).toContainEqual({ row: 5, col: 5 });
    expect(candidates).not.toContainEqual({ row: 4, col: 7 });
    expect(candidates).not.toContainEqual({ row: 7, col: 7 });
  });

  it('rejects occupied and out-of-range moves', () => {
    const state = gomoku.applyMove(gomoku.initialState(), { row: 7, col: 7 });
    expect(() => gomoku.applyMove(state, { row: 7, col: 7 })).toThrow();
    expect(() => gomoku.applyMove(state, { row: SIZE, col: 7 })).toThrow();
  });

  it('does not mutate the source board', () => {
    const state = deepFreeze(gomoku.initialState());
    const next = gomoku.applyMove(state, { row: 7, col: 7 });
    expect(state.board[7]?.[7]).toBeNull();
    expect(next.board[7]?.[7]).toBe(0);
    expect(next.turn).toBe(1);
  });
});
