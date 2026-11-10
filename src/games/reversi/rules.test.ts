import { describe, expect, it } from 'vitest';
import type { Player } from '@/engine/types';
import {
  SIZE,
  flipsForMove,
  legalMovesFor,
  reversi,
  scoreOf,
  type Cell,
  type ReversiState,
} from '@/games/reversi/rules';

function emptyBoard(): Cell[][] {
  return Array.from({ length: SIZE }, () => Array<Cell>(SIZE).fill(null));
}

function stateWith(board: Cell[][], turn: Player = 0): ReversiState {
  return { board, turn, passed: false };
}

function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

describe('moves', () => {
  it('starts with the standard four legal moves', () => {
    expect(legalMovesFor(reversi.initialState())).toEqual([
      [2, 4],
      [3, 5],
      [4, 2],
      [5, 3],
    ]);
  });

  it('places a disc and flips every captured line', () => {
    const state = reversi.initialState();
    expect(flipsForMove(state.board, [2, 4], 0)).toEqual([[3, 4]]);
    const next = reversi.applyMove(state, [2, 4]);
    expect(next.board[2]?.[4]).toBe(0);
    expect(next.board[3]?.[4]).toBe(0);
    expect(next.turn).toBe(1);
    expect(scoreOf(next.board)).toEqual([4, 1]);
  });

  it('rejects occupied, unflippable, and out-of-range moves', () => {
    const state = reversi.initialState();
    expect(() => reversi.applyMove(state, [3, 3])).toThrow();
    expect(() => reversi.applyMove(state, [0, 0])).toThrow();
    expect(() => reversi.applyMove(state, [SIZE, 0])).toThrow();
  });

  it('does not mutate the source board', () => {
    const state = deepFreeze(reversi.initialState());
    const next = reversi.applyMove(state, [2, 4]);
    expect(state.board[2]?.[4]).toBeNull();
    expect(state.board[3]?.[4]).toBe(1);
    expect(next.board[3]?.[4]).toBe(0);
  });
});

describe('passing and terminal results', () => {
  it('passes when the current player has no move but the opponent does', () => {
    const board = emptyBoard().map((row) => row.map(() => 0 as Cell));
    const firstRow = board[0];
    if (firstRow) {
      firstRow[0] = null;
      firstRow[2] = 1;
    }
    const state = stateWith(board);

    expect(legalMovesFor(state)).toEqual([]);
    expect(reversi.isTerminal(state)).toBe(false);
    expect(reversi.winner(state)).toBeNull();

    const passed = reversi.passTurn?.(state);
    expect(passed?.turn).toBe(1);
    expect(legalMovesFor(passed!)).toContainEqual([0, 0]);
  });

  it('rejects a pass while a move is available', () => {
    expect(() => reversi.passTurn?.(reversi.initialState())).toThrow();
  });

  it('ends when neither player can move and compares disc counts', () => {
    const board = emptyBoard().map((row, r) => row.map(() => (r < 4 ? 0 : 1)));
    const state = stateWith(board);
    expect(reversi.isTerminal(state)).toBe(true);
    expect(reversi.winner(state)).toBe('draw');

    const firstRow = board[0];
    if (firstRow) firstRow[0] = 1;
    expect(reversi.winner(stateWith(board))).toBe(1);
  });

  it('can finish a full match while automatically passing blocked turns', () => {
    let state = reversi.initialState();
    for (let turn = 0; turn < SIZE * SIZE * 2 && !reversi.isTerminal(state); turn++) {
      const moves = legalMovesFor(state);
      state =
        moves.length === 0
          ? (reversi.passTurn?.(state) ?? state)
          : reversi.applyMove(state, moves[0] ?? [0, 0]);
    }
    expect(reversi.isTerminal(state)).toBe(true);
    expect(reversi.winner(state)).not.toBeNull();
  });
});
