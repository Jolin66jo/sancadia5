export interface HangmanState {
  word: string;
  guessedLetters: string[];
  wrongCount: number;
  maxWrong: number;
}

export type HangmanStatus = 'playing' | 'won' | 'lost';

export function guessLetter(state: HangmanState, letter: string): HangmanState {
  const normalized = letter.trim().toLowerCase();
  if (!normalized || normalized.length !== 1 || !/^[a-z]$/.test(normalized)) {
    return state;
  }

  if (state.guessedLetters.includes(normalized)) {
    return state;
  }

  const guessedLetters = [...state.guessedLetters, normalized];
  const wasCorrect = state.word.toLowerCase().includes(normalized);

  return {
    ...state,
    guessedLetters,
    wrongCount: wasCorrect ? state.wrongCount : state.wrongCount + 1,
  };
}

export function maskedWord(state: HangmanState): string {
  return state.word
    .split('')
    .map((letter) => (state.guessedLetters.includes(letter.toLowerCase()) ? letter : '_'))
    .join(' ');
}

export function status(state: HangmanState): HangmanStatus {
  const wordLetters = new Set(state.word.toLowerCase().split(''));
  const solved = [...wordLetters].every((letter) => state.guessedLetters.includes(letter));
  if (solved) return 'won';
  if (state.wrongCount >= state.maxWrong) return 'lost';
  return 'playing';
}

export function remainingLetters(state: HangmanState): string[] {
  const used = new Set(state.guessedLetters);
  return Array.from({ length: 26 }, (_, index) => String.fromCharCode(97 + index)).filter(
    (letter) => !used.has(letter),
  );
}
