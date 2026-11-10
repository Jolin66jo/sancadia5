import type {
  CodebreakerConfig,
  CodebreakerGuess,
  GameStatus,
  HistoryEntry,
  Rng,
  ScoreFeedback,
} from '@/engine/codebreaker/types';

function validateConfig(config: CodebreakerConfig): void {
  if (
    !Number.isInteger(config.symbols) ||
    config.symbols < 1 ||
    !Number.isInteger(config.length) ||
    config.length < 1 ||
    !Number.isInteger(config.maxAttempts) ||
    config.maxAttempts < 1
  ) {
    throw new RangeError('Codebreaker config values must be positive integers.');
  }
  if (!config.allowRepeats && config.length > config.symbols) {
    throw new RangeError('Code length cannot exceed the number of unique symbols.');
  }
}

function randomIndex(rng: Rng, length: number): number {
  const sample = rng();
  if (!Number.isFinite(sample) || sample < 0 || sample >= 1) {
    throw new RangeError('RNG must return a finite number in the range [0, 1).');
  }
  return Math.floor(sample * length);
}

export function generateSecret(
  config: CodebreakerConfig,
  rng: Rng = Math.random,
): CodebreakerGuess {
  validateConfig(config);
  const secret: number[] = [];

  if (config.allowRepeats) {
    for (let index = 0; index < config.length; index += 1) {
      const value = randomIndex(rng, config.symbols);
      secret.push(value);
    }
    return secret;
  }

  const values = Array.from({ length: config.symbols }, (_, index) => index);
  const limit = Math.min(config.length, values.length);

  for (let index = 0; index < limit; index += 1) {
    const position = randomIndex(rng, values.length);
    const value = values.splice(position, 1)[0];
    if (value === undefined) {
      break;
    }
    secret.push(value);
  }

  return secret;
}

export function scoreGuess(secret: CodebreakerGuess, guess: CodebreakerGuess): ScoreFeedback {
  let exact = 0;
  const secretCounts = new Map<number, number>();
  const guessCounts = new Map<number, number>();

  for (let index = 0; index < secret.length; index += 1) {
    const secretValue = secret[index];
    const guessValue = guess[index];

    if (secretValue === undefined || guessValue === undefined) {
      continue;
    }

    if (secretValue === guessValue) {
      exact += 1;
    } else {
      const secretCount = secretCounts.get(secretValue) ?? 0;
      const guessCount = guessCounts.get(guessValue) ?? 0;
      secretCounts.set(secretValue, secretCount + 1);
      guessCounts.set(guessValue, guessCount + 1);
    }
  }

  let misplaced = 0;
  for (const [symbol, count] of secretCounts.entries()) {
    misplaced += Math.min(count, guessCounts.get(symbol) ?? 0);
  }

  return { exact, misplaced };
}

export function validateGuess(config: CodebreakerConfig, guess: CodebreakerGuess): boolean {
  if (!Array.isArray(guess) || guess.length !== config.length) return false;

  return guess.every((value) => {
    if (!Number.isInteger(value)) return false;
    if (value < 0 || value >= config.symbols) return false;
    if (!config.allowRepeats && guess.filter((entry) => entry === value).length > 1) return false;
    return true;
  });
}

export function gameStatus(history: HistoryEntry[], config: CodebreakerConfig): GameStatus {
  if (history.length === 0) return 'playing';

  const last = history[history.length - 1];
  if (!last) return 'playing';
  if (last.feedback.exact === config.length) return 'won';
  if (history.length >= config.maxAttempts) return 'lost';
  return 'playing';
}

export function consistentCandidates(
  config: CodebreakerConfig,
  history: HistoryEntry[],
): CodebreakerGuess[] {
  validateConfig(config);
  const candidates: CodebreakerGuess[] = [];
  const values = Array.from({ length: config.symbols }, (_, index) => index);

  function walk(prefix: number[], nextDepth: number) {
    if (nextDepth === config.length) {
      const candidate = prefix.slice();
      const matchesHistory = history.every((entry) => {
        const feedback = scoreGuess(candidate, entry.guess);
        return (
          feedback.exact === entry.feedback.exact && feedback.misplaced === entry.feedback.misplaced
        );
      });

      if (matchesHistory) {
        candidates.push(candidate);
      }
      return;
    }

    for (const value of values) {
      if (!config.allowRepeats && prefix.includes(value)) continue;
      prefix.push(value);
      walk(prefix, nextDepth + 1);
      prefix.pop();
    }
  }

  walk([], 0);
  return candidates;
}

export function getValidationError(
  config: CodebreakerConfig,
  guess: CodebreakerGuess,
): string | null {
  if (!Array.isArray(guess) || guess.length !== config.length) {
    return `Guess must contain ${config.length} symbols.`;
  }

  for (let index = 0; index < guess.length; index += 1) {
    const value = guess[index];
    if (value === undefined || !Number.isInteger(value)) {
      return 'Each symbol must be a whole number.';
    }
    if (value < 0 || value >= config.symbols) {
      return `Each symbol must be between 0 and ${config.symbols - 1}.`;
    }
  }

  if (!config.allowRepeats) {
    const seen = new Set<number>();
    for (const value of guess) {
      if (seen.has(value)) {
        return 'Duplicate symbols are not allowed in this mode.';
      }
      seen.add(value);
    }
  }

  return null;
}
