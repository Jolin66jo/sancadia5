import { describe, expect, it } from "vitest";
import { calculatePoints, calculatePuzzlePoints } from "@/lib/points";
import { games } from "@/games/registry";

const sharedFormulaCases = [
  {
    kind: "versus",
    difficulty: "beginner",
    outcome: "win",
    streak: 1,
    attempts: 1,
    maxAttempts: 1,
    hints: 0,
    expected: 15,
  },
  {
    kind: "versus",
    difficulty: "expert",
    outcome: "win",
    streak: 10,
    attempts: 1,
    maxAttempts: 1,
    hints: 0,
    expected: 65,
  },
  {
    kind: "versus",
    difficulty: "expert",
    outcome: "draw",
    streak: 8,
    attempts: 1,
    maxAttempts: 1,
    hints: 0,
    expected: 5,
  },
  {
    kind: "versus",
    difficulty: "expert",
    outcome: "loss",
    streak: 8,
    attempts: 1,
    maxAttempts: 1,
    hints: 0,
    expected: 1,
  },
  {
    kind: "puzzle",
    difficulty: "beginner",
    outcome: "win",
    streak: 1,
    attempts: 1,
    maxAttempts: 10,
    hints: 1,
    expected: 20,
  },
  {
    kind: "puzzle",
    difficulty: "beginner",
    outcome: "win",
    streak: 0,
    attempts: 10,
    maxAttempts: 10,
    hints: 5,
    expected: 1,
  },
  {
    kind: "puzzle",
    difficulty: "expert",
    outcome: "loss",
    streak: 0,
    attempts: 5,
    maxAttempts: 5,
    hints: 0,
    expected: 1,
  },
  {
    kind: "puzzle",
    difficulty: "professional",
    outcome: "win",
    streak: 2,
    attempts: 4,
    maxAttempts: 8,
    hints: 0,
    expected: 36,
  },
] as const;

describe("calculatePoints", () => {
  it("matches the SQL formula cases in supabase/tests/security_functions.sql", () => {
    for (const formulaCase of sharedFormulaCases) {
      const actual =
        formulaCase.kind === "puzzle"
          ? calculatePuzzlePoints({
              outcome: formulaCase.outcome === "loss" ? "lose" : "win",
              difficulty: formulaCase.difficulty,
              attempts: formulaCase.attempts,
              maxAttempts: formulaCase.maxAttempts,
              hintsUsed: formulaCase.hints,
              winStreak: formulaCase.streak,
            }).total
          : calculatePoints(
              formulaCase.outcome === "loss" ? "lose" : formulaCase.outcome,
              formulaCase.difficulty,
              formulaCase.streak,
            );

      expect(actual, JSON.stringify(formulaCase)).toBe(formulaCase.expected);
    }
  });

  it("awards difficulty-based win points", () => {
    expect(calculatePoints("win", "beginner")).toBe(10);
    expect(calculatePoints("win", "professional")).toBe(20);
    expect(calculatePoints("win", "expert")).toBe(40);
  });

  it("adds a capped five-points-per-win streak bonus", () => {
    expect(calculatePoints("win", "beginner", 1)).toBe(15);
    expect(calculatePoints("win", "beginner", 10)).toBe(35);
  });

  it("awards fixed points for draws and losses", () => {
    expect(calculatePoints("draw", "expert", 8)).toBe(5);
    expect(calculatePoints("lose", "expert", 8)).toBe(1);
  });

  it("applies the shared points rules to every registered game", () => {
    for (const game of games) {
      expect(calculatePoints("win", "beginner"), game.id).toBe(10);
      expect(calculatePoints("draw", "beginner"), game.id).toBe(5);
      expect(calculatePoints("lose", "beginner"), game.id).toBe(1);
    }
  });

  it("breaks down puzzle points and applies hint costs without zero-point wins", () => {
    expect(
      calculatePuzzlePoints({
        outcome: "win",
        difficulty: "beginner",
        attempts: 1,
        maxAttempts: 10,
        hintsUsed: 1,
        winStreak: 1,
      }),
    ).toEqual({ base: 10, efficiency: 10, streak: 5, hintCost: 5, total: 20 });
    expect(
      calculatePuzzlePoints({
        outcome: "win",
        difficulty: "beginner",
        attempts: 10,
        maxAttempts: 10,
        hintsUsed: 5,
      }).total,
    ).toBe(1);
    expect(
      calculatePuzzlePoints({
        outcome: "lose",
        difficulty: "expert",
        attempts: 5,
        maxAttempts: 5,
      }).total,
    ).toBe(1);
  });
});
