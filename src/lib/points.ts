import type { Difficulty } from '@/engine/difficulty';
import type { GameOutcome } from '@/components/GameOverDialog';

const WIN_POINTS: Record<Difficulty, number> = {
  beginner: 10,
  professional: 20,
  expert: 40,
};

export function calculatePoints(
  outcome: GameOutcome,
  difficulty: Difficulty,
  winStreak = 0,
): number {
  if (outcome === 'draw') return 5;
  if (outcome === 'lose') return 1;
  return WIN_POINTS[difficulty] + Math.min(winStreak * 5, 25);
}

export function calculatePuzzlePoints({
  outcome,
  difficulty,
  attempts,
  maxAttempts,
  hintsUsed = 0,
  winStreak = 0,
}: {
  outcome: 'win' | 'lose';
  difficulty: Difficulty;
  attempts: number;
  maxAttempts: number;
  hintsUsed?: number;
  winStreak?: number;
}): { base: number; efficiency: number; streak: number; hintCost: number; total: number } {
  if (!Number.isInteger(attempts) || attempts < 1) {
    throw new RangeError('Puzzle attempts must be a positive integer.');
  }
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
    throw new RangeError('Maximum attempts must be a positive integer.');
  }
  if (!Number.isInteger(hintsUsed) || hintsUsed < 0) {
    throw new RangeError('Hints used must be a non-negative integer.');
  }

  const base = outcome === 'win' ? WIN_POINTS[difficulty] : 1;
  const efficiency =
    outcome === 'win' && maxAttempts > 1
      ? Math.round((10 * (maxAttempts - attempts)) / (maxAttempts - 1))
      : 0;
  const streak = outcome === 'win' ? Math.min(winStreak * 5, 25) : 0;
  const hintCost = hintsUsed * 5;
  const subtotal = base + efficiency + streak - hintCost;
  const total = outcome === 'win' ? Math.max(1, subtotal) : 1;

  return { base, efficiency, streak, hintCost, total };
}
