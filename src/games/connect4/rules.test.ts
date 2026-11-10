import { describe, expect, it } from 'vitest';
import type { Player } from '@/engine/types';
import {
  COLS,
  ROWS,
  connect4,
  findWin,
  type Cell,
  type Connect4State,
} from '@/games/connect4/rules';

function emptyBoard(): Cell[][] {
  return Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(null));
}

function boardWith(cells: [number, number, Player][]): Cell[][] {
  const board = emptyBoard();
  for (const [row, col, owner] of cells) {
    const boardRow = board[row];
    if (boardRow) boardRow[col] = owner;
  }
  return board;
}

function stateWith(board: Cell[][], turn: Player = 0): Connect4State {
  return { board, turn };
}

function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null) {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

function play(moves: number[]): Connect4State {
  return moves.reduce((state, move) => connect4.applyMove(state, move), connect4.initialState());
}

describe('win detection', () => {
  it('detects four in a row horizontally', () => {
    const board = boardWith([
      [0, 1, 0],
      [0, 2, 0],
      [0, 3, 0],
      [0, 4, 0],
    ]);
    expect(findWin(board)?.owner).toBe(0);
    expect(connect4.winner(stateWith(board))).toBe(0);
  });

  it('detects four in a column', () => {
    const board = boardWith([
      [0, 3, 1],
      [1, 3, 1],
      [2, 3, 1],
      [3, 3, 1],
    ]);
    expect(findWin(board)?.owner).toBe(1);
  });

  it('detects four on a rising diagonal', () => {
    const board = boardWith([
      [0, 0, 0],
      [1, 1, 0],
      [2, 2, 0],
      [3, 3, 0],
    ]);
    expect(findWin(board)?.cells).toEqual([
      [0, 0],
      [1, 1],
      [2, 2],
      [3, 3],
    ]);
  });

  it('detects four on a falling diagonal', () => {
    const board = boardWith([
      [3, 0, 1],
      [2, 1, 1],
      [1, 2, 1],
      [0, 3, 1],
    ]);
    expect(findWin(board)?.owner).toBe(1);
    expect(connect4.isTerminal(stateWith(board))).toBe(true);
  });

  it('does not report three in a row as a win', () => {
    const board = boardWith([
      [0, 0, 0],
      [0, 1, 0],
      [0, 2, 0],
    ]);
    expect(findWin(board)).toBeNull();
    expect(connect4.isTerminal(stateWith(board))).toBe(false);
  });
});

describe('moves', () => {
  it('drops a piece to the lowest empty row', () => {
    const state = play([3, 3]);
    expect(state.board[0]?.[3]).toBe(0);
    expect(state.board[1]?.[3]).toBe(1);
    expect(state.board[2]?.[3]).toBeNull();
  });

  it('switches the turn after each move', () => {
    expect(play([0]).turn).toBe(1);
    expect(play([0, 1]).turn).toBe(0);
  });

  it('rejects a move into a full column', () => {
    const state = play([0, 0, 0, 0, 0, 0]);
    expect(connect4.legalMoves(state)).not.toContain(0);
    expect(() => connect4.applyMove(state, 0)).toThrow();
  });

  it('rejects an out-of-range column', () => {
    expect(() => connect4.applyMove(connect4.initialState(), 7)).toThrow();
  });

  it('reports a draw when the board is full with no four', () => {
    const pattern = [
      [0, 0, 1, 1, 0, 0, 1],
      [1, 1, 0, 0, 1, 1, 0],
      [0, 0, 1, 1, 0, 0, 1],
      [1, 1, 0, 0, 1, 1, 0],
      [0, 0, 1, 1, 0, 0, 1],
      [1, 1, 0, 0, 1, 1, 0],
    ];
    const board = pattern.map((row) => row.map((cell) => cell as Player));
    const state = stateWith(board);
    expect(findWin(board)).toBeNull();
    expect(connect4.winner(state)).toBe('draw');
    expect(connect4.legalMoves(state)).toEqual([]);
  });

  it('offers no moves once a player has won', () => {
    const state = play([0, 1, 0, 1, 0, 1, 0]);
    expect(connect4.winner(state)).toBe(0);
    expect(connect4.legalMoves(state)).toEqual([]);
  });

  it('orders moves from the centre outwards', () => {
    expect(connect4.orderMoves?.(connect4.initialState(), [0, 1, 2, 3, 4, 5, 6])).toEqual([
      3, 2, 4, 1, 5, 0, 6,
    ]);
  });
});

describe('immutability', () => {
  it('does not change the state it is given when applying a move', () => {
    const state = deepFreeze(play([2]));
    const next = connect4.applyMove(state, 4);
    expect(state.board[0]?.[4]).toBeNull();
    expect(next.board[0]?.[4]).toBe(1);
    expect(next).not.toBe(state);
  });
});
