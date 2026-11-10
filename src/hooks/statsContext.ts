import { createContext } from 'react';
import type { GameResult, StatsData } from '@/lib/stats';

export interface StatsContextValue {
  stats: StatsData;
  recordResult: (result: GameResult) => number;
  resetStats: () => void;
}

export const StatsContext = createContext<StatsContextValue | null>(null);
