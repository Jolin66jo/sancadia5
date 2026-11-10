import { getDifficultySettings, pickAiMove, type Difficulty } from '@/engine/difficulty';
import type { Player } from '@/engine/types';
import {
  COLS,
  ROWS,
  connect4,
  type Cell,
  type Connect4Move,
  type Connect4State,
} from '@/games/connect4/rules';

const DEPTH_CAPS = {
  maxDepthCap: { beginner: 2, professional: 4, expert: 6 },
  timeLimitMs: 1000,
};

const DIRECTIONS: readonly (readonly [number, number])[] = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

const OWN_WINDOW_SCORE = [0, 1, 10, 50, 1000];
const OPPONENT_WINDOW_SCORE = [0, -1, -8, -60, -1000];
const CENTRE_COL = Math.floor(COLS / 2);
const CENTRE_BONUS = 3;

function windowScore(own: number, opponent: number): number {
  if (own > 0 && opponent > 0) return 0;
  if (own > 0) return OWN_WINDOW_SCORE[own] ?? 0;
  return OPPONENT_WINDOW_SCORE[opponent] ?? 0;
}

export function evaluate(state: Connect4State, player: Player): number {
  const opponent: Player = player === 0 ? 1 : 0;
  const { board } = state;
  let score = 0;

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      for (const [dRow, dCol] of DIRECTIONS) {
        const endRow = row + dRow * 3;
        const endCol = col + dCol * 3;
        if (endRow < 0 || endRow >= ROWS || endCol < 0 || endCol >= COLS) continue;

        let own = 0;
        let opp = 0;
        for (let step = 0; step < 4; step++) {
          const cell: Cell = board[row + dRow * step]?.[col + dCol * step] ?? null;
          if (cell === player) own++;
          else if (cell === opponent) opp++;
        }
        score += windowScore(own, opp);
      }
    }

    const centre = board[row]?.[CENTRE_COL] ?? null;
    if (centre === player) score += CENTRE_BONUS;
    else if (centre === opponent) score -= CENTRE_BONUS;
  }

  return score;
}

export function chooseMove(state: Connect4State, difficulty: Difficulty): Connect4Move | null {
  return pickAiMove(connect4, state, getDifficultySettings(difficulty, DEPTH_CAPS), evaluate);
}
