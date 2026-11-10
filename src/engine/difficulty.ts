import { getBestMove } from '@/engine/ai';
import type { GameEngine, Player } from '@/engine/types';

export type Difficulty = 'beginner' | 'professional' | 'expert';

export interface DifficultyCaps {
  maxDepthCap: Record<Difficulty, number>;
  timeLimitMs?: number;
}

export interface DifficultySettings {
  maxDepth: number;
  mistakeChance: number;
  timeLimitMs?: number;
}

const MISTAKE_CHANCE: Record<Difficulty, number> = {
  beginner: 0.3,
  professional: 0.1,
  expert: 0,
};

export function getDifficultySettings(level: Difficulty, caps: DifficultyCaps): DifficultySettings {
  return {
    maxDepth: caps.maxDepthCap[level],
    mistakeChance: MISTAKE_CHANCE[level],
    timeLimitMs: caps.timeLimitMs,
  };
}

export function pickAiMove<State, Move>(
  engine: GameEngine<State, Move>,
  state: State,
  settings: DifficultySettings,
  evaluate?: (state: State, player: Player) => number,
): Move | null {
  const moves = engine.legalMoves(state);
  if (moves.length === 0) return null;

  if (Math.random() < settings.mistakeChance) {
    const index = Math.floor(Math.random() * moves.length);
    const move = moves[index];
    if (move === undefined) return null;
    return move;
  }
  return getBestMove(engine, state, {
    maxDepth: settings.maxDepth,
    evaluate,
    timeLimitMs: settings.timeLimitMs,
  });
}
