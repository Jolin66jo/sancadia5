import type { Difficulty } from '@/engine/difficulty';
import { beginnerWords, expertWords, professionalWords } from '@/games/hangman/words';

const wordsByDifficulty: Record<Difficulty, string[]> = {
  beginner: beginnerWords,
  professional: professionalWords,
  expert: expertWords,
};

function recentWordsKey(difficulty: Difficulty) {
  return `classic-games-arcade:hangman:recent:${difficulty}`;
}

export function pickHangmanWord(difficulty: Difficulty): string {
  const words = wordsByDifficulty[difficulty];
  const key = recentWordsKey(difficulty);
  let recent: string[] = [];
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(key) ?? '[]');
    if (Array.isArray(stored)) {
      recent = stored.filter(
        (word): word is string => typeof word === 'string' && words.includes(word),
      );
    }
  } catch (error) {
    console.warn('Unable to read recent Hangman words:', error);
  }

  const unseen = words.filter((word) => !recent.includes(word));
  const pool = unseen.length > 0 ? unseen : words;
  const index = Math.floor(Math.random() * pool.length);
  const word = pool[index];
  if (!word) {
    throw new Error(
      `No Hangman words are available for ${difficulty} (list: ${words.length}, pool: ${pool.length}, index: ${index}).`,
    );
  }

  try {
    window.localStorage.setItem(
      key,
      JSON.stringify(unseen.length > 0 ? [...recent, word] : [word]),
    );
  } catch (error) {
    console.warn('Unable to save recent Hangman words:', error);
  }
  return word;
}
