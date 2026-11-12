import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cwd } from "node:process";
import { describe, expect, it } from "vitest";
import { games } from "@/games/registry";

const migration = readFileSync(
  resolve(
    cwd(),
    "supabase/migrations/20261112000000_games_profiles_stats_results.sql",
  ),
  "utf8",
);

const seedSection = migration.match(
  /insert into public\.games\s*\(\s*id,\s*name,\s*type\s*\)\s*values([\s\S]*?)on conflict \(id\) do nothing;/i,
);

const seededIds = seedSection
  ? [
      ...seedSection[1].matchAll(
        /\(\s*'([^']+)'\s*,\s*'[^']+'\s*,\s*'[^']+'\s*\)/g,
      ),
    ].map(([, id]) => id!)
  : [];

describe("games allowlist migration", () => {
  it("seeds every available game in the registry", () => {
    expect(seedSection, "migration must include the games seed").not.toBeNull();
    expect(new Set(seededIds).size).toBe(seededIds.length);

    const seededIdSet = new Set(seededIds);
    for (const game of games.filter(
      (candidate) => candidate.status === "available",
    )) {
      expect(
        seededIdSet.has(game.id),
        `${game.id} is missing from the seed`,
      ).toBe(true);
    }
  });

  it("does not seed IDs missing from the registry or marked coming soon", () => {
    const registryById = new Map(games.map((game) => [game.id, game]));

    for (const id of seededIds) {
      expect(
        registryById.get(id),
        `${id} is not in the registry`,
      ).toBeDefined();
      expect(registryById.get(id)?.status, `${id} is not available`).toBe(
        "available",
      );
    }
  });
});
