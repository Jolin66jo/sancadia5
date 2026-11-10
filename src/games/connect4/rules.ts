import type { GameEngine, Player, Winner } from '@/engine/types';

export const COLS = 7;
export const ROWS = 6;

export type Cell = Player | null;
export type Board = readonly (readonly Cell[])[];

export interface Connect4State {
  readonly board: Board;
  readonly turn: Player;
}

export type Connect4Move = number;

export interface WinningFour {
  owner: Player;
  cells: readonly (readonly [number, number])[];
}

const DIRECTIONS: readonly (readonly [number, number])[] = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

const CENTRE_FIRST = [3, 2, 4, 1, 5, 0, 6];

function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < ROWS && col >= 0 && col < COLS;
}

export function findWin(board: Board): WinningFour | null {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const owner = board[row]?.[col] ?? null;
      if (owner === null) continue;
      for (const [dRow, dCol] of DIRECTIONS) {
        const cells = [0, 1, 2, 3].map((step) => [row + dRow * step, col + dCol * step] as const);
        const fours = cells.every(([r, c]) => inBounds(r, c) && (board[r]?.[c] ?? null) === owner);
        if (fours) return { owner, cells };
      }
    }
  }
  return null;
}

export function landingRow(board: Board, col: number): number | null {
  for (let row = 0; row < ROWS; row++) {
    if ((board[row]?.[col] ?? null) === null) return row;
  }
  return null;
}

function resultOf(board: Board): Winner {
  const win = findWin(board);
  if (win) return win.owner;
  return board.every((row) => row.every((cell) => cell !== null)) ? 'draw' : null;
}

function legalMovesFor(state: Connect4State): Connect4Move[] {
  if (resultOf(state.board) !== null) return [];
  return Array.from({ length: COLS }, (_, col) => col).filter(
    (col) => landingRow(state.board, col) !== null,
  );
}

export const connect4: GameEngine<Connect4State, Connect4Move> = {
  id: 'connect-4',
  initialState: () => ({
    board: Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(null)),
    turn: 0,
  }),
  currentPlayer: (state) => state.turn,
  legalMoves: legalMovesFor,
  applyMove: (state, move) => {
    if (!legalMovesFor(state).includes(move)) {
      throw new Error(`Illegal move: ${move}`);
    }
    const row = landingRow(state.board, move);
    if (row === null) {
      throw new Error(`Illegal move: ${move}`);
    }
    const board = state.board.map((cells, r) => {
      if (r !== row) return [...cells];
      return cells.map((cell, c) => (c === move ? state.turn : cell));
    });
    return { board, turn: state.turn === 0 ? 1 : 0 };
  },
  isTerminal: (state) => resultOf(state.board) !== null,
  winner: (state) => resultOf(state.board),
  orderMoves: (_state, moves) => CENTRE_FIRST.filter((col) => moves.includes(col)),
};
