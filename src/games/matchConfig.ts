import type { Difficulty } from '@/engine/difficulty';

export type MatchConfig =
  { mode: 'computer'; humanFirst: boolean; difficulty: Difficulty } | { mode: 'two-player' };
