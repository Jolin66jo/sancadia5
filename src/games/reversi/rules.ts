import type { GameEngine, Player, Winner } from '@/engine/types';

export const SIZE = 8;

export type Cell = Player | null;
export type Board = readonly (readonly Cell[])[];

export interface ReversiState {
  readonly board: Board;
  readonly turn: Player;
  readonly passed: boolean;
}

export type ReversiMove = readonly [number, number];

const DIRS: readonly (readonly [number, number])[] = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

function inBounds(r: number, c: number): boolean {
  return r >= 0 && r < SIZE && c >= 0 && c < SIZE;
}

function otherPlayer(player: Player): Player {
  return player === 0 ? 1 : 0;
}

function flipsFor(board: Board, row: number, col: number, player: Player): ReversiMove[] {
  const opponent: Player = player === 0 ? 1 : 0;
  const flipped: ReversiMove[] = [];
  for (const [dr, dc] of DIRS) {
    const line: ReversiMove[] = [];
    let r = row + dr;
    let c = col + dc;
    while (inBounds(r, c) && board[r]?.[c] === opponent) {
      line.push([r, c]);
      r += dr;
      c += dc;
    }
    if (line.length > 0 && inBounds(r, c) && board[r]?.[c] === player) {
      flipped.push(...line);
    }
  }
  return flipped;
}

export function flipsForMove(board: Board, move: ReversiMove, player: Player): ReversiMove[] {
  const [row, col] = move;
  if (!inBounds(row, col) || board[row]?.[col] !== null) return [];
  return flipsFor(board, row, col, player);
}

export function legalMovesFor(state: ReversiState): ReversiMove[] {
  const moves: ReversiMove[] = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (state.board[r]?.[c] !== null) continue;
      if (flipsFor(state.board, r, c, state.turn).length > 0) {
        moves.push([r, c]);
      }
    }
  }
  return moves;
}

function countDiscs(board: Board): [number, number] {
  let p0 = 0;
  let p1 = 0;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const cell = board[r]?.[c] ?? null;
      if (cell === 0) p0++;
      else if (cell === 1) p1++;
    }
  }
  return [p0, p1];
}

export function scoreOf(board: Board): readonly [number, number] {
  return countDiscs(board);
}

function applyMoveInternal(state: ReversiState, move: ReversiMove): ReversiState {
  const [row, col] = move;
  const flipped = flipsFor(state.board, row, col, state.turn);
  const board = state.board.map((cells) => [...cells]);
  const targetRow = board[row];
  if (!targetRow) {
    throw new Error(`Invalid move row: ${row}`);
  }
  targetRow[col] = state.turn;
  for (const [r, c] of flipped) {
    const rowCells = board[r];
    if (rowCells) rowCells[c] = state.turn;
  }
  return { board, turn: otherPlayer(state.turn), passed: false };
}

export const reversi: GameEngine<ReversiState, ReversiMove> = {
  id: 'reversi',
  initialState: () => {
    const board: Cell[][] = Array.from({ length: SIZE }, () => Array<Cell>(SIZE).fill(null));
    const mid = SIZE / 2;
    const midRowAbove = board[mid - 1];
    const midRow = board[mid];
    if (midRowAbove) {
      midRowAbove[mid - 1] = 0;
      midRowAbove[mid] = 1;
    }
    if (midRow) {
      midRow[mid] = 0;
      midRow[mid - 1] = 1;
    }
    return { board, turn: 0, passed: false };
  },
  currentPlayer: (state) => state.turn,
  legalMoves: legalMovesFor,
  movesEqual: (a, b) => a[0] === b[0] && a[1] === b[1],
  applyMove: (state, move) => {
    const legal = legalMovesFor(state);
    if (!legal.some((m) => m[0] === move[0] && m[1] === move[1])) {
      throw new Error(`Illegal move: ${move}`);
    }
    return applyMoveInternal(state, move);
  },
  passTurn: (state) => {
    if (
      legalMovesFor(state).length > 0 ||
      legalMovesFor({ ...state, turn: otherPlayer(state.turn) }).length === 0
    ) {
      throw new Error('Cannot pass when a legal move is available or the game is over');
    }
    return { board: state.board, turn: otherPlayer(state.turn), passed: true };
  },
  isTerminal: (state) =>
    legalMovesFor(state).length === 0 &&
    legalMovesFor({ ...state, turn: otherPlayer(state.turn) }).length === 0,
  winner: (state): Winner => {
    if (
      legalMovesFor(state).length > 0 ||
      legalMovesFor({ ...state, turn: otherPlayer(state.turn) }).length > 0
    )
      return null;
    const [p0, p1] = countDiscs(state.board);
    if (p0 > p1) return 0;
    if (p1 > p0) return 1;
    return 'draw';
  },
};
