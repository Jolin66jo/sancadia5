export type MastermindDifficulty = 'beginner' | 'professional' | 'expert';

export interface MastermindConfig {
  symbols: number;
  length: number;
  allowRepeats: boolean;
  maxAttempts: number;
  hints: number;
}

export const mastermindConfigs: Record<MastermindDifficulty, MastermindConfig> = {
  beginner: { symbols: 6, length: 4, allowRepeats: true, maxAttempts: 10, hints: 3 },
  professional: { symbols: 6, length: 4, allowRepeats: true, maxAttempts: 8, hints: 2 },
  expert: { symbols: 8, length: 5, allowRepeats: true, maxAttempts: 10, hints: 1 },
};
