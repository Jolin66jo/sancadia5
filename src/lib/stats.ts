import type { Difficulty } from '@/engine/difficulty';
import type { GameOutcome } from '@/components/GameOverDialog';
import { calculatePoints, calculatePuzzlePoints } from '@/lib/points';

export const STATS_VERSION = 2;
export const STATS_STORAGE_KEY = 'classic-games-arcade:stats';
const MAX_RECORDED_RESULTS = 500;

export interface DifficultyStats {
  played: number;
  wins: number;
  losses: number;
  draws: number;
  currentWinStreak: number;
  bestWinStreak: number;
}

export interface GameStats {
  computer: Record<Difficulty, DifficultyStats>;
  puzzle: Record<Difficulty, PuzzleDifficultyStats>;
  twoPlayerPlayed: number;
}

export interface PuzzleDifficultyStats {
  played: number;
  solved: number;
  failed: number;
  bestAttempts: number | null;
  totalWinningAttempts: number;
  currentWinStreak: number;
  bestWinStreak: number;
}

export interface StatsData {
  version: typeof STATS_VERSION;
  totalPoints: number;
  games: Record<string, GameStats>;
  appliedResultIds: string[];
}

export interface GameResult {
  resultId: string;
  gameId: string;
  mode: 'computer' | 'puzzle' | 'two-player';
  difficulty?: Difficulty;
  outcome: GameOutcome;
  attempts?: number;
  maxAttempts?: number;
  hintsUsed?: number;
}

export interface RecordedResult {
  stats: StatsData;
  pointsEarned: number;
}

function emptyDifficultyStats(): DifficultyStats {
  return { played: 0, wins: 0, losses: 0, draws: 0, currentWinStreak: 0, bestWinStreak: 0 };
}

function emptyPuzzleDifficultyStats(): PuzzleDifficultyStats {
  return {
    played: 0,
    solved: 0,
    failed: 0,
    bestAttempts: null,
    totalWinningAttempts: 0,
    currentWinStreak: 0,
    bestWinStreak: 0,
  };
}

export function emptyStats(): StatsData {
  return { version: STATS_VERSION, totalPoints: 0, games: {}, appliedResultIds: [] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nonNegativeInteger(value: unknown): number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

function parseDifficultyStats(value: unknown): DifficultyStats {
  if (!isRecord(value)) return emptyDifficultyStats();
  return {
    played: nonNegativeInteger(value.played),
    wins: nonNegativeInteger(value.wins),
    losses: nonNegativeInteger(value.losses),
    draws: nonNegativeInteger(value.draws),
    currentWinStreak: nonNegativeInteger(value.currentWinStreak),
    bestWinStreak: nonNegativeInteger(value.bestWinStreak),
  };
}

function parsePuzzleDifficultyStats(value: unknown): PuzzleDifficultyStats {
  if (!isRecord(value)) return emptyPuzzleDifficultyStats();
  const solved = nonNegativeInteger(value.solved);
  const bestAttempts = nonNegativeInteger(value.bestAttempts);
  return {
    played: nonNegativeInteger(value.played),
    solved,
    failed: nonNegativeInteger(value.failed),
    bestAttempts: bestAttempts > 0 ? bestAttempts : null,
    totalWinningAttempts: nonNegativeInteger(value.totalWinningAttempts),
    currentWinStreak: nonNegativeInteger(value.currentWinStreak),
    bestWinStreak: nonNegativeInteger(value.bestWinStreak),
  };
}

function parseGameStats(value: unknown): GameStats {
  const record = isRecord(value) ? value : {};
  const computer = isRecord(record.computer) ? record.computer : {};
  const puzzle = isRecord(record.puzzle) ? record.puzzle : {};
  return {
    computer: {
      beginner: parseDifficultyStats(computer.beginner),
      professional: parseDifficultyStats(computer.professional),
      expert: parseDifficultyStats(computer.expert),
    },
    puzzle: {
      beginner: parsePuzzleDifficultyStats(puzzle.beginner),
      professional: parsePuzzleDifficultyStats(puzzle.professional),
      expert: parsePuzzleDifficultyStats(puzzle.expert),
    },
    twoPlayerPlayed: nonNegativeInteger(record.twoPlayerPlayed),
  };
}

export function migrateStats(value: unknown): StatsData {
  if (!isRecord(value)) return emptyStats();
  if (value.version === 1 || value.version === STATS_VERSION) {
    const rawGames = isRecord(value.games) ? value.games : {};
    const games: Record<string, GameStats> = {};
    for (const [gameId, game] of Object.entries(rawGames)) games[gameId] = parseGameStats(game);
    const appliedResultIds = Array.isArray(value.appliedResultIds)
      ? value.appliedResultIds
          .filter((id): id is string => typeof id === 'string')
          .slice(-MAX_RECORDED_RESULTS)
      : [];
    return {
      version: STATS_VERSION,
      totalPoints: nonNegativeInteger(value.totalPoints),
      games,
      appliedResultIds,
    };
  }
  if (value.version === 0) return emptyStats();
  return emptyStats();
}

export function parseStats(value: unknown): StatsData {
  return migrateStats(value);
}

function gameStatsFor(stats: StatsData, gameId: string): GameStats {
  return (
    stats.games[gameId] ?? {
      computer: {
        beginner: emptyDifficultyStats(),
        professional: emptyDifficultyStats(),
        expert: emptyDifficultyStats(),
      },
      puzzle: {
        beginner: emptyPuzzleDifficultyStats(),
        professional: emptyPuzzleDifficultyStats(),
        expert: emptyPuzzleDifficultyStats(),
      },
      twoPlayerPlayed: 0,
    }
  );
}

export function recordGameResult(stats: StatsData, result: GameResult): RecordedResult {
  if (stats.appliedResultIds.includes(result.resultId)) return { stats, pointsEarned: 0 };

  const next = migrateStats(stats);
  const game = gameStatsFor(next, result.gameId);
  let pointsEarned = 0;

  if (result.mode === 'two-player') {
    game.twoPlayerPlayed++;
  } else if (result.mode === 'puzzle') {
    if (result.outcome === 'draw') {
      throw new Error('Puzzle results cannot be draws.');
    }

    const difficulty = result.difficulty ?? 'beginner';
    const record = game.puzzle[difficulty];
    const attempts = result.attempts;
    const maxAttempts = result.maxAttempts;
    if (!Number.isInteger(attempts) || attempts === undefined || attempts < 1) {
      throw new RangeError('Puzzle results require a positive attempt count.');
    }
    if (!Number.isInteger(maxAttempts) || maxAttempts === undefined || maxAttempts < 1) {
      throw new RangeError('Puzzle results require a positive maximum attempt count.');
    }

    record.played++;
    const points = calculatePuzzlePoints({
      outcome: result.outcome,
      difficulty,
      attempts,
      maxAttempts,
      hintsUsed: result.hintsUsed ?? 0,
      winStreak: result.outcome === 'win' ? record.currentWinStreak + 1 : 0,
    });

    if (result.outcome === 'win') {
      record.solved++;
      record.totalWinningAttempts += attempts;
      record.bestAttempts =
        record.bestAttempts === null ? attempts : Math.min(record.bestAttempts, attempts);
      record.currentWinStreak++;
      record.bestWinStreak = Math.max(record.bestWinStreak, record.currentWinStreak);
    } else {
      record.failed++;
      record.currentWinStreak = 0;
    }

    pointsEarned = points.total;
    next.totalPoints += pointsEarned;
  } else {
    const difficulty = result.difficulty ?? 'beginner';
    const record = game.computer[difficulty];
    record.played++;
    record[result.outcome === 'win' ? 'wins' : result.outcome === 'lose' ? 'losses' : 'draws']++;

    if (result.outcome === 'win') {
      record.currentWinStreak++;
      record.bestWinStreak = Math.max(record.bestWinStreak, record.currentWinStreak);
    } else {
      record.currentWinStreak = 0;
    }

    pointsEarned = calculatePoints(result.outcome, difficulty, record.currentWinStreak);
    next.totalPoints += pointsEarned;
  }

  next.games[result.gameId] = game;
  next.appliedResultIds = [...next.appliedResultIds, result.resultId].slice(-MAX_RECORDED_RESULTS);
  return { stats: next, pointsEarned };
}
