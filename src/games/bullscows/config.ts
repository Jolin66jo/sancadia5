export type BullsCowsDifficulty = 'beginner' | 'professional' | 'expert';

export interface BullsCowsConfig {
  length: number;
  maxAttempts: number;
  hints: number;
}

export const bullsCowsConfigs: Record<BullsCowsDifficulty, BullsCowsConfig> = {
  beginner: { length: 4, maxAttempts: 12, hints: 3 },
  professional: { length: 4, maxAttempts: 10, hints: 2 },
  expert: { length: 5, maxAttempts: 10, hints: 1 },
};
