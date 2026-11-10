import { getDifficultySettings, pickAiMove, type Difficulty } from '@/engine/difficulty';
import type { Player } from '@/engine/types';
import {
  SIZE,
  WIN_LENGTH,
  gomoku,
  type Cell,
  type GomokuMove,
  type GomokuState,
} from '@/games/gomoku/rules';

const DEPTH_CAPS = {
  maxDepthCap: { beginner: 1, professional: 2, expert: 3 },
  timeLimitMs: 1500,
};

const DIRECTIONS: readonly (readonly [number, number])[] = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

const PATTERN_SCORE = [0, 1, 8, 80, 1200, 1_000_000];
const DEFENCE_WEIGHT = 1.15;

function windowScore(count: number, openEnds: number): number {
  const base = PATTERN_SCORE[count] ?? 0;
  if (count === WIN_LENGTH) return base;
  if (count === 4) return openEnds === 2 ? 40_000 : openEnds === 1 ? 4_000 : base;
  if (count === 3) return openEnds === 2 ? 500 : openEnds === 1 ? 60 : base;
  if (count === 2) return openEnds === 2 ? 30 : openEnds === 1 ? 5 : base;
  return base * (openEnds === 2 ? 1 : 0.5);
}

function countWindow(
  board: GomokuState['board'],
  row: number,
  col: number,
  dRow: number,
  dCol: number,
  player: Player,
): number {
  let count = 0;
  let opponentFound = false;
  for (let step = 0; step < WIN_LENGTH; step++) {
    const cell = board[row + dRow * step]?.[col + dCol * step] ?? null;
    if (cell === player) count++;
    else if (cell !== null) opponentFound = true;
  }
  if (opponentFound) return 0;

  let openEnds = 0;
  const beforeRow = row - dRow;
  const beforeCol = col - dCol;
  const afterRow = row + dRow * WIN_LENGTH;
  const afterCol = col + dCol * WIN_LENGTH;
  if (
    beforeRow >= 0 &&
    beforeRow < SIZE &&
    beforeCol >= 0 &&
    beforeCol < SIZE &&
    (board[beforeRow]?.[beforeCol] ?? null) === null
  ) {
    openEnds++;
  }
  if (
    afterRow >= 0 &&
    afterRow < SIZE &&
    afterCol >= 0 &&
    afterCol < SIZE &&
    (board[afterRow]?.[afterCol] ?? null) === null
  ) {
    openEnds++;
  }
  return windowScore(count, openEnds);
}

function countWindows(board: GomokuState['board'], player: Player): number {
  let score = 0;
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      for (const [dRow, dCol] of DIRECTIONS) {
        const endRow = row + dRow * (WIN_LENGTH - 1);
        const endCol = col + dCol * (WIN_LENGTH - 1);
        if (endRow < 0 || endRow >= SIZE || endCol < 0 || endCol >= SIZE) continue;
        score += countWindow(board, row, col, dRow, dCol, player);
      }
    }
  }
  return score;
}

export function evaluate(state: GomokuState, player: Player): number {
  const opponent: Player = player === 0 ? 1 : 0;
  let centerScore = 0;
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      const cell: Cell = state.board[row]?.[col] ?? null;
      const centerBonus = Math.max(0, 7 - Math.max(Math.abs(7 - row), Math.abs(7 - col)));
      if (cell === player) centerScore += centerBonus;
      else if (cell === opponent) centerScore -= centerBonus;
    }
  }
  return (
    countWindows(state.board, player) -
    countWindows(state.board, opponent) * DEFENCE_WEIGHT +
    centerScore
  );
}

export function chooseMove(state: GomokuState, difficulty: Difficulty): GomokuMove | null {
  return pickAiMove(gomoku, state, getDifficultySettings(difficulty, DEPTH_CAPS), evaluate);
}
