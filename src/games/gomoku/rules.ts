import type { GameEngine, Player, Winner } from '@/engine/types';

export const SIZE = 15;
export const WIN_LENGTH = 5;

export type Cell = Player | null;
export type Board = readonly (readonly Cell[])[];

export interface GomokuState {
  readonly board: Board;
  readonly turn: Player;
}

export interface GomokuMove {
  readonly row: number;
  readonly col: number;
}

export interface WinningLine {
  readonly owner: Player;
  readonly cells: readonly GomokuMove[];
}

const DIRECTIONS: readonly (readonly [number, number])[] = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < SIZE && col >= 0 && col < SIZE;
}

export function findWin(board: Board): WinningLine | null {
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      const owner = board[row]?.[col] ?? null;
      if (owner === null) continue;

      for (const [dRow, dCol] of DIRECTIONS) {
        const endRow = row + dRow * (WIN_LENGTH - 1);
        const endCol = col + dCol * (WIN_LENGTH - 1);
        if (!inBounds(endRow, endCol)) continue;

        const cells = Array.from({ length: WIN_LENGTH }, (_, index) => ({
          row: row + dRow * index,
          col: col + dCol * index,
        }));
        if (cells.every(({ row: r, col: c }) => (board[r]?.[c] ?? null) === owner)) {
          return { owner, cells };
        }
      }
    }
  }
  return null;
}

export function candidateMovesFor(state: GomokuState): GomokuMove[] {
  const moves = new Map<string, GomokuMove>();
  let hasStone = false;

  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if ((state.board[row]?.[col] ?? null) === null) continue;
      hasStone = true;
      for (let dRow = -2; dRow <= 2; dRow++) {
        for (let dCol = -2; dCol <= 2; dCol++) {
          const nextRow = row + dRow;
          const nextCol = col + dCol;
          if (inBounds(nextRow, nextCol) && (state.board[nextRow]?.[nextCol] ?? null) === null) {
            moves.set(`${nextRow},${nextCol}`, { row: nextRow, col: nextCol });
          }
        }
      }
    }
  }

  if (!hasStone) {
    const center = Math.floor(SIZE / 2);
    return [{ row: center, col: center }];
  }

  return [...moves.values()];
}

function scoreLine(board: Board, row: number, col: number, player: Player): number {
  let score = 0;
  for (const [dRow, dCol] of DIRECTIONS) {
    let count = 1;
    let openEnds = 0;
    for (const direction of [-1, 1]) {
      let nextRow = row + dRow * direction;
      let nextCol = col + dCol * direction;
      while (inBounds(nextRow, nextCol) && (board[nextRow]?.[nextCol] ?? null) === player) {
        count++;
        nextRow += dRow * direction;
        nextCol += dCol * direction;
      }
      if (inBounds(nextRow, nextCol) && (board[nextRow]?.[nextCol] ?? null) === null) openEnds++;
    }

    if (count >= WIN_LENGTH) score += 1_000_000;
    else if (count === 4) score += openEnds === 2 ? 40_000 : openEnds === 1 ? 4_000 : 0;
    else if (count === 3) score += openEnds === 2 ? 500 : openEnds === 1 ? 60 : 0;
    else if (count === 2) score += openEnds === 2 ? 30 : openEnds === 1 ? 5 : 0;
  }
  return score;
}

function moveOrderingScore(state: GomokuState, move: GomokuMove): number {
  const opponent: Player = state.turn === 0 ? 1 : 0;
  return (
    scoreLine(state.board, move.row, move.col, state.turn) +
    scoreLine(state.board, move.row, move.col, opponent) * 1.1
  );
}

function isFull(board: Board): boolean {
  return board.every((row) => row.every((cell) => cell !== null));
}

export function legalMovesFor(state: GomokuState): GomokuMove[] {
  if (findWin(state.board) || isFull(state.board)) return [];
  const moves: GomokuMove[] = [];
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if ((state.board[row]?.[col] ?? null) === null) moves.push({ row, col });
    }
  }
  return moves;
}

export const gomoku: GameEngine<GomokuState, GomokuMove> = {
  id: 'gomoku',
  initialState: () => ({
    board: Array.from({ length: SIZE }, () => Array<Cell>(SIZE).fill(null)),
    turn: 0,
  }),
  currentPlayer: (state) => state.turn,
  legalMoves: legalMovesFor,
  candidateMoves: candidateMovesFor,
  movesEqual: (a, b) => a.row === b.row && a.col === b.col,
  orderMoves: (state, moves) =>
    [...moves].sort((a, b) => moveOrderingScore(state, b) - moveOrderingScore(state, a)),
  applyMove: (state, move) => {
    if (
      !legalMovesFor(state).some(
        (candidate) => candidate.row === move.row && candidate.col === move.col,
      )
    ) {
      throw new Error(`Illegal move: ${move.row},${move.col}`);
    }

    const board = state.board.map((row) => [...row]);
    const targetRow = board[move.row];
    if (!targetRow) {
      throw new Error(`Illegal move: ${move.row},${move.col}`);
    }
    targetRow[move.col] = state.turn;
    return { board, turn: state.turn === 0 ? 1 : 0 };
  },
  isTerminal: (state) => findWin(state.board) !== null || isFull(state.board),
  winner: (state): Winner => findWin(state.board)?.owner ?? (isFull(state.board) ? 'draw' : null),
};
