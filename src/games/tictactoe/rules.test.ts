import { describe, expect, it } from 'vitest';
import type { Player } from '@/engine/types';
import {
  WIN_LINES,
  findWin,
  ticTacToe,
  type Cell,
  type TicTacToeState,
} from '@/games/tictactoe/rules';

function boardWith(owner: Player, indices: readonly number[]): Cell[] {
  return Array.from({ length: 9 }, (_, i) => (indices.includes(i) ? owner : null));
}

function stateWith(board: Cell[], turn: Player = 0): TicTacToeState {
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
  WIN_LINES.forEach((line) => {
    (['0', '1'] as const).forEach((ownerKey) => {
      const owner: Player = ownerKey === '0' ? 0 : 1;
      it(`detects a win for player ${owner} on line ${line.join(',')}`, () => {
        const state = stateWith(boardWith(owner, [...line]));
        expect(findWin(state.board)).toEqual({ owner, line });
        expect(ticTacToe.isTerminal(state)).toBe(true);
        expect(ticTacToe.winner(state)).toBe(owner);
      });
    });
  });

  it('does not report a win when a line is mixed', () => {
    const board: Cell[] = [0, 1, 0, null, null, null, null, null, null];
    expect(findWin(board)).toBeNull();
    expect(ticTacToe.winner(stateWith(board))).toBeNull();
  });
});

describe('draws and in-progress games', () => {
  it('detects a full board with no winner as a draw', () => {
    const state = stateWith([0, 1, 0, 0, 1, 1, 1, 0, 0]);
    expect(ticTacToe.isTerminal(state)).toBe(true);
    expect(ticTacToe.winner(state)).toBe('draw');
    expect(ticTacToe.legalMoves(state)).toEqual([]);
  });

  it('reports an empty board as in progress with every cell legal', () => {
    const state = ticTacToe.initialState();
    expect(ticTacToe.isTerminal(state)).toBe(false);
    expect(ticTacToe.winner(state)).toBeNull();
    expect(ticTacToe.legalMoves(state)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('has no legal moves once a line is complete', () => {
    const state = stateWith(boardWith(0, [0, 1, 2]));
    expect(ticTacToe.legalMoves(state)).toEqual([]);
  });
});

describe('moves', () => {
  it('alternates turns', () => {
    const first = ticTacToe.applyMove(ticTacToe.initialState(), 0);
    expect(first.turn).toBe(1);
    const second = ticTacToe.applyMove(first, 4);
    expect(second.turn).toBe(0);
  });

  it('rejects a move on an occupied cell', () => {
    const state = stateWith([null, null, null, null, 0, null, null, null, null], 1);
    expect(() => ticTacToe.applyMove(state, 4)).toThrow();
  });

  it('rejects moves outside the board', () => {
    const state = ticTacToe.initialState();
    expect(() => ticTacToe.applyMove(state, 9)).toThrow();
    expect(() => ticTacToe.applyMove(state, -1)).toThrow();
  });

  it('rejects moves once the game is over', () => {
    const state = stateWith(boardWith(0, [0, 1, 2]), 1);
    expect(() => ticTacToe.applyMove(state, 5)).toThrow();
  });

  it('never mutates the state it is given', () => {
    const state = deepFreeze(ticTacToe.initialState());
    const next = ticTacToe.applyMove(state, 4);
    expect(state.board[4]).toBeNull();
    expect(state.turn).toBe(0);
    expect(next).not.toBe(state);
    expect(next.board[4]).toBe(0);
  });
});
