import type { GameOutcome } from '@/components/GameOverDialog';
import type { Player, Winner } from '@/engine/types';
import type { MatchConfig } from '@/games/matchConfig';

export interface MatchScores {
  0: number;
  1: number;
  draws: number;
}

export const NO_SCORES: MatchScores = { 0: 0, 1: 0, draws: 0 };

export interface Summary {
  outcome: GameOutcome;
  headline: string;
  message: string;
}

export function describeResult(
  result: Player | 'draw',
  config: MatchConfig,
  humanSide: Player,
): Summary {
  if (result === 'draw') {
    return {
      outcome: 'draw',
      headline: "It's a draw",
      message: 'Neither side found a gap this time.',
    };
  }
  if (config.mode === 'two-player') {
    return { outcome: 'win', headline: `Player ${result + 1} wins!`, message: 'Well played.' };
  }
  return result === humanSide
    ? { outcome: 'win', headline: 'You won!', message: 'Well played. Ready for another round?' }
    : { outcome: 'lose', headline: 'Computer wins', message: 'So close. Try again for a rematch.' };
}

export function statusText(
  result: Winner,
  turn: Player,
  config: MatchConfig,
  humanSide: Player,
): string {
  if (result !== null) return describeResult(result, config, humanSide).headline;
  if (config.mode === 'two-player') return `Player ${turn + 1}'s turn`;
  return turn === humanSide ? 'Your turn' : 'Computer is thinking';
}

export function scoreEntries(config: MatchConfig, humanSide: Player, scores: MatchScores) {
  if (config.mode === 'two-player') {
    return [
      { label: 'Player 1', value: scores[0] },
      { label: 'Player 2', value: scores[1] },
      { label: 'Draws', value: scores.draws },
    ];
  }
  const computerSide: Player = humanSide === 0 ? 1 : 0;
  return [
    { label: 'Player', value: scores[humanSide] },
    { label: 'Computer', value: scores[computerSide] },
    { label: 'Draws', value: scores.draws },
  ];
}
