import { getDifficultySettings, pickAiMove, type Difficulty } from '@/engine/difficulty';
import type { Player } from '@/engine/types';
import {
  SIZE,
  reversi,
  type Cell,
  type ReversiMove,
  type ReversiState,
} from '@/games/reversi/rules';

const DEPTH_CAPS = {
  maxDepthCap: { beginner: 1, professional: 3, expert: 5 },
  timeLimitMs: 1200,
};

const WEIGHTS: readonly (readonly number[])[] = [
  [100, -20, 10, 5, 5, 10, -20, 100],
  [-20, -50, -2, -2, -2, -2, -50, -20],
  [10, -2, 1, 1, 1, 1, -2, 10],
  [5, -2, 1, 1, 1, 1, -2, 5],
  [5, -2, 1, 1, 1, 1, -2, 5],
  [10, -2, 1, 1, 1, 1, -2, 10],
  [-20, -50, -2, -2, -2, -2, -50, -20],
  [100, -20, 10, 5, 5, 10, -20, 100],
];

export function evaluate(state: ReversiState, player: Player): number {
  const opponent: Player = player === 0 ? 1 : 0;
  let score = 0;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const cell: Cell = state.board[r]?.[c] ?? null;
      const weight = WEIGHTS[r]?.[c] ?? 0;
      if (cell === player) score += weight;
      else if (cell === opponent) score -= weight;
    }
  }
  const myMoves = reversi.legalMoves(state).length;
  const oppState: ReversiState = { board: state.board, turn: opponent, passed: state.passed };
  const oppMoves = reversi.legalMoves(oppState).length;
  score += (myMoves - oppMoves) * 5;
  return score;
}

export function chooseMove(state: ReversiState, difficulty: Difficulty): ReversiMove | null {
  return pickAiMove(reversi, state, getDifficultySettings(difficulty, DEPTH_CAPS), evaluate);
}
