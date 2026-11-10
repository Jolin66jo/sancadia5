export type CodebreakerConfig = {
  symbols: number;
  length: number;
  allowRepeats: boolean;
  maxAttempts: number;
};

export type CodebreakerGuess = number[];

export type ScoreFeedback = {
  exact: number;
  misplaced: number;
};

export type GameStatus = 'playing' | 'won' | 'lost';

export type HistoryEntry = {
  guess: CodebreakerGuess;
  feedback: ScoreFeedback;
};

export type Rng = () => number;
