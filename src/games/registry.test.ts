import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cwd } from "node:process";
import { describe, expect, it } from "vitest";
import { aiRegistry } from "@/games/aiRegistry";
import { isNationId } from "@/games/nations";
import {
  CHINESE_GAME_IDS,
  games,
  gameComponents,
  getGamesForNation,
  getGamesForRegion,
  type GameInfo,
} from "@/games/registry";
import { rulesContent } from "@/games/rulesContent";
import { loadGameContentTranslations } from "@/lib/i18n";

describe("game registry consistency", () => {
  it("has translations for every game description and rules paragraph in every supported language", async () => {
    const languages = [
      "fr",
      "it",
      "es",
      "pt",
      "nl",
      "zh",
      "hi",
      "de",
      "sv",
      "ja",
    ] as const;
    const translations = await Promise.all(
      languages.map(
        async (language) =>
          [language, await loadGameContentTranslations(language)] as const,
      ),
    );
    for (const [gameId, rules] of Object.entries(rulesContent)) {
      const ruleText = [
        rules.goal,
        rules.setup,
        ...rules.howToPlay,
        rules.winning,
        ...rules.specialRules,
        ...Object.values(rules.difficultyNotes),
        ...rules.tips,
      ];
      for (const text of ruleText) {
        for (const [language, content] of translations) {
          expect(content[text], `${gameId} ${language}: ${text}`).toBeTruthy();
        }
      }
    }

    for (const game of games) {
      for (const [language, content] of translations) {
        expect(
          content[game.description],
          `${game.id} ${language} description`,
        ).toBeTruthy();
      }
    }
  });

  it("keeps every Chinese game ID in the database catalog migration", () => {
    const migration = readFileSync(
      resolve(
        cwd(),
        "supabase/migrations/20261110020000_phase14_chinese_game_catalog.sql",
      ),
      "utf8",
    );
    for (const id of CHINESE_GAME_IDS) {
      expect(
        migration,
        `${id} must be present in the database catalog`,
      ).toContain(`'${id}'`);
    }
    const xiangqiActivation = readFileSync(
      resolve(cwd(), "supabase/migrations/20261110030000_activate_xiangqi.sql"),
      "utf8",
    );
    expect(xiangqiActivation).toContain("where game_id = 'xiangqi'");
  });

  it("has a rules entry for every game and no rules for unregistered game ids", () => {
    expect(Object.keys(rulesContent).sort()).toEqual(
      games.map((game) => game.id).sort(),
    );
  });

  it("has worker AI entries for every available engine-based versus game", () => {
    const workerAiGames = games.filter((game) =>
      [
        "noughts-and-crosses",
        "connect-4",
        "gomoku",
        "reversi",
        "checkers",
        "latrunculi",
        "xiangqi",
      ].includes(game.id),
    );

    for (const game of workerAiGames) {
      expect(
        aiRegistry,
        `${game.id} is missing from aiRegistry`,
      ).toHaveProperty(game.id);
    }
  });

  it("lists the Chinese batch in the Traditional Chinese region with only shipped games active", () => {
    for (const id of CHINESE_GAME_IDS) {
      const game = games.find((candidate) => candidate.id === id);
      expect(game, `${id} must be in the registry`).toBeDefined();
      expect(game?.region).toBe("chinese");
      expect(game?.nations).toContain("china");
      expect(game?.status).toBe(id === "xiangqi" ? "available" : "coming-soon");
    }
    expect(getGamesForRegion("chinese").map((game) => game.id)).toEqual([
      ...CHINESE_GAME_IDS,
    ]);
    expect(games.find((game) => game.id === "connect-4")?.region).toBe("other");
    for (const id of CHINESE_GAME_IDS) {
      expect(
        aiRegistry,
        `${id} must be included in the worker game allowlist`,
      ).toHaveProperty(id);
      expect(
        aiRegistry[id].available,
        `${id} availability must match its shipped state`,
      ).toBe(id === "xiangqi");
    }
  });

  it("makes all seven mini-games playable", () => {
    const expectedStatuses = {
      "dots-and-boxes": "available",
      mancala: "available",
      dominoes: "available",
      ludo: "available",
      snake: "available",
      "2048": "available",
      minesweeper: "available",
    };

    for (const [id, status] of Object.entries(expectedStatuses)) {
      expect(games.find((game) => game.id === id)?.status, id).toBe(status);
      expect(
        gameComponents,
        `${id} must have a playable component`,
      ).toHaveProperty(id);
    }
  });

  it("uses only nation IDs that exist in the nation list", () => {
    for (const game of games) {
      for (const nationId of game.nations ?? []) {
        expect(
          isNationId(nationId),
          `${game.id} uses unknown nation "${nationId}"`,
        ).toBe(true);
      }
    }
  });

  it("lists LATRUNCULI under Italy", () => {
    expect(getGamesForNation("italy").map((game) => game.id)).toContain(
      "latrunculi",
    );
    expect(gameComponents).toHaveProperty("latrunculi");
  });

  it("shares Gomoku between China and Japan", () => {
    expect(getGamesForNation("china").map((game) => game.id)).toContain(
      "gomoku",
    );
    expect(getGamesForNation("japan").map((game) => game.id)).toContain(
      "gomoku",
    );
  });

  it("lists Japan-pack games as coming soon until each game is implemented", () => {
    const japanPackIds = [
      "renju",
      "shogi",
      "go",
      "koikoi",
      "bansugoroku",
      "esugoroku",
      "karuta",
      "ohajiki",
      "fukuwarai",
    ];

    for (const id of japanPackIds) {
      expect(
        getGamesForNation("japan").find((game) => game.id === id),
        id,
      ).toMatchObject({
        status: "coming-soon",
        nations: expect.arrayContaining(["japan"]),
      });
      expect(
        getGamesForNation("japan").find((game) => game.id === id)?.region,
      ).toBe(id === "go" ? "chinese" : "japanese");
    }
  });

  it("filters all game statuses by nation and shows every game for all nations", () => {
    const comingSoonGame: GameInfo = {
      ...games[0]!,
      id: "future-game",
      status: "coming-soon",
      nations: ["france"],
    };
    const gameList = [...games, comingSoonGame];

    expect(getGamesForNation("all", gameList)).toHaveLength(gameList.length);
    expect(
      getGamesForNation("france", gameList).map((game) => game.id),
    ).toContain("future-game");
    expect(
      getGamesForNation("china", gameList).map((game) => game.id),
    ).not.toContain("future-game");
  });
});
