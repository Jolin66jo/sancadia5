import { describe, expect, it } from 'vitest';
import { emptyStats, parseStats, recordGameResult, type GameResult } from '@/lib/stats';

const win: GameResult = {
  resultId: 'match-1',
  gameId: 'connect-4',
  mode: 'computer',
  difficulty: 'beginner',
  outcome: 'win',
};

describe('stats', () => {
  it('records wins, points and streaks by game and difficulty', () => {
    const first = recordGameResult(emptyStats(), win);
    const second = recordGameResult(first.stats, { ...win, resultId: 'match-2' });
    const record = second.stats.games['connect-4']?.computer.beginner;
    expect(record).toBeDefined();

    expect(first.pointsEarned).toBe(15);
    expect(second.pointsEarned).toBe(20);
    if (!record) throw new Error('Missing connect-4 stats');
    expect(record).toMatchObject({ played: 2, wins: 2, currentWinStreak: 2, bestWinStreak: 2 });
    expect(second.stats.totalPoints).toBe(35);
  });

  it('deduplicates a result ID to prevent double counting', () => {
    const first = recordGameResult(emptyStats(), win);
    const repeated = recordGameResult(first.stats, win);
    expect(repeated.stats).toBe(first.stats);
    expect(repeated.pointsEarned).toBe(0);
    const record = repeated.stats.games['connect-4']?.computer.beginner;
    expect(record).toBeDefined();
    if (!record) throw new Error('Missing connect-4 stats');
    expect(record.played).toBe(1);
  });

  it('resets the current streak after a draw or loss but preserves the best', () => {
    const first = recordGameResult(emptyStats(), win);
    const second = recordGameResult(first.stats, { ...win, resultId: 'match-2' });
    const third = recordGameResult(second.stats, { ...win, resultId: 'match-3', outcome: 'draw' });
    const record = third.stats.games['connect-4']?.computer.beginner;
    expect(record).toBeDefined();
    if (!record) throw new Error('Missing connect-4 stats');
    expect(record).toMatchObject({ currentWinStreak: 0, bestWinStreak: 2, draws: 1 });
  });

  it('counts two-player games without difficulty stats or points', () => {
    const result = recordGameResult(emptyStats(), {
      resultId: 'local-match',
      gameId: 'gomoku',
      mode: 'two-player',
      outcome: 'win',
    });
    const gomokuStats = result.stats.games.gomoku;
    expect(gomokuStats).toBeDefined();
    if (!gomokuStats) throw new Error('Missing gomoku stats');
    expect(gomokuStats.twoPlayerPlayed).toBe(1);
    expect(result.stats.totalPoints).toBe(0);
    expect(result.pointsEarned).toBe(0);
  });

  it('safely parses corrupt, malformed and older-version storage', () => {
    expect(parseStats(null)).toEqual(emptyStats());
    expect(parseStats({ version: 0, points: 999 })).toEqual(emptyStats());
    expect(
      parseStats({ version: 1, totalPoints: -4, games: [], appliedResultIds: 'broken' }),
    ).toEqual(emptyStats());
    expect(
      parseStats({
        version: 2,
        totalPoints: 12,
        games: { game: { computer: { beginner: { wins: 2 } } } },
      }),
    ).toMatchObject({
      version: 2,
      totalPoints: 12,
      games: { game: { computer: { beginner: { wins: 2, played: 0 } }, twoPlayerPlayed: 0 } },
    });
  });

  it('migrates version 1 stats without losing game records or points', () => {
    const migrated = parseStats({
      version: 1,
      totalPoints: 75,
      games: {
        'connect-4': {
          computer: {
            beginner: {
              played: 4,
              wins: 3,
              losses: 1,
              draws: 0,
              currentWinStreak: 2,
              bestWinStreak: 3,
            },
          },
          twoPlayerPlayed: 2,
        },
      },
      appliedResultIds: ['old-result'],
    });

    expect(migrated).toMatchObject({
      version: 2,
      totalPoints: 75,
      games: {
        'connect-4': {
          computer: { beginner: { played: 4, wins: 3, losses: 1, bestWinStreak: 3 } },
          puzzle: {
            beginner: {
              played: 0,
              solved: 0,
              failed: 0,
              bestAttempts: null,
              totalWinningAttempts: 0,
            },
          },
          twoPlayerPlayed: 2,
        },
      },
      appliedResultIds: ['old-result'],
    });
  });

  it('records puzzle attempts, hints, best and average solved attempts once', () => {
    const first = recordGameResult(emptyStats(), {
      resultId: 'puzzle-1',
      gameId: 'mastermind',
      mode: 'puzzle',
      difficulty: 'beginner',
      outcome: 'win',
      attempts: 2,
      maxAttempts: 10,
      hintsUsed: 1,
    });
    const duplicate = recordGameResult(first.stats, {
      resultId: 'puzzle-1',
      gameId: 'mastermind',
      mode: 'puzzle',
      difficulty: 'beginner',
      outcome: 'win',
      attempts: 2,
      maxAttempts: 10,
      hintsUsed: 1,
    });
    const next = recordGameResult(first.stats, {
      resultId: 'puzzle-2',
      gameId: 'mastermind',
      mode: 'puzzle',
      difficulty: 'beginner',
      outcome: 'win',
      attempts: 4,
      maxAttempts: 10,
    });

    expect(first.pointsEarned).toBeGreaterThan(0);
    expect(duplicate.stats).toBe(first.stats);
    expect(duplicate.pointsEarned).toBe(0);
    expect(next.stats.games.mastermind?.puzzle.beginner).toMatchObject({
      played: 2,
      solved: 2,
      failed: 0,
      bestAttempts: 2,
      totalWinningAttempts: 6,
      currentWinStreak: 2,
      bestWinStreak: 2,
    });
  });
});
