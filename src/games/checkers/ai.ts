import { getDifficultySettings, pickAiMove, type Difficulty } from '@/engine/difficulty';
import type { Player } from '@/engine/types';
import {
  SIZE,
  checkers,
  type CheckersMove,
  type CheckersState,
  type Occupant,
} from '@/games/checkers/rules';

const DEPTH_CAPS = {
  maxDepthCap: { beginner: 1, professional: 4, expert: 7 },
  timeLimitMs: 1500,
};

const MAN_VALUE = 100;
const KING_VALUE = 175;

export function evaluate(state: CheckersState, player: Player): number {
  let score = 0;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const occ: Occupant | null = state.board[r]?.[c] ?? null;
      if (occ === null) continue;
      const base = occ.type === 'king' ? KING_VALUE : MAN_VALUE;
      const positional = occ.type === 'man' ? (occ.player === 0 ? (SIZE - 1 - r) * 2 : r * 2) : 0;
      const centerBonus = c >= 2 && c <= 5 ? 3 : 0;
      const total = base + positional + centerBonus;
      if (occ.player === player) score += total;
      else score -= total;
    }
  }
  return score;
}

export function chooseMove(state: CheckersState, difficulty: Difficulty): CheckersMove | null {
  return pickAiMove(checkers, state, getDifficultySettings(difficulty, DEPTH_CAPS), evaluate);
}
