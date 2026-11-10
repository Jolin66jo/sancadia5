import type { GameEngine, Player, Winner } from '@/engine/types';

export type Cell = Player | null;

export interface TicTacToeState {
  readonly board: readonly Cell[];
  readonly turn: Player;
}

export type TicTacToeMove = number;

export const WIN_LINES: readonly (readonly [number, number, number])[] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export interface WinningLine {
  owner: Player;
  line: readonly [number, number, number];
}

export function findWin(board: readonly Cell[]): WinningLine | null {
  for (const line of WIN_LINES) {
    const owner = board[line[0]] ?? null;
    if (
      owner !== null &&
      owner === (board[line[1]] ?? null) &&
      owner === (board[line[2]] ?? null)
    ) {
      return { owner, line };
    }
  }
  return null;
}

function resultOf(board: readonly Cell[]): Winner {
  const win = findWin(board);
  if (win) return win.owner;
  return board.every((cell) => cell !== null) ? 'draw' : null;
}

function legalMovesFor(state: TicTacToeState): TicTacToeMove[] {
  if (resultOf(state.board) !== null) return [];
  return state.board.flatMap((cell, index) => (cell === null ? [index] : []));
}

export const ticTacToe: GameEngine<TicTacToeState, TicTacToeMove> = {
  id: 'noughts-and-crosses',
  initialState: () => ({ board: Array<Cell>(9).fill(null), turn: 0 }),
  currentPlayer: (state) => state.turn,
  legalMoves: legalMovesFor,
  applyMove: (state, move) => {
    if (!legalMovesFor(state).includes(move)) {
      throw new Error(`Illegal move: ${move}`);
    }
    const board = [...state.board];
    board[move] = state.turn;
    return { board, turn: state.turn === 0 ? 1 : 0 };
  },
  isTerminal: (state) => resultOf(state.board) !== null,
  winner: (state) => resultOf(state.board),
};
