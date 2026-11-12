import { describe, expect, it } from "vitest";
import { loadGameContentTranslations, translateText } from "@/lib/i18n";

describe("game content translations", () => {
  const gomokuGoal =
    "Be the first player to place five stones in an unbroken straight line.";

  it.each([
    [
      "fr",
      "Soyez le premier joueur à placer cinq pierres sur une ligne droite ininterrompue.",
    ],
    [
      "es",
      "Sé el primer jugador en colocar cinco piedras en línea recta ininterrumpida.",
    ],
    ["zh", "成为第一个将五颗石子放在一条不间断的直线上的玩家。"],
    [
      "ja",
      "途切れることのない直線上に 5 つの石を配置した最初のプレイヤーになりましょう。",
    ],
  ] as const)(
    "uses the %s translation for game rules",
    async (language, expected) => {
      const translations = await loadGameContentTranslations(language);
      expect(translateText(language, gomokuGoal, undefined, translations)).toBe(
        expected,
      );
    },
  );

  it("keeps game titles and unmatched text unchanged", () => {
    expect(translateText("ja", "Gomoku")).toBe("Gomoku");
    expect(translateText("de", "A title not in the game content catalog")).toBe(
      "A title not in the game content catalog",
    );
    expect(translateText("en", gomokuGoal)).toBe(gomokuGoal);
  });

  it("substitutes translated description placeholders without changing the game name", () => {
    expect(translateText("ja", "How to play {game}", { game: "Gomoku" })).toBe(
      "How to play Gomoku",
    );
  });

  it("uses the loaded dictionary to translate game content", async () => {
    const translations = await loadGameContentTranslations("fr");
    expect(translateText("fr", gomokuGoal, undefined, translations)).not.toBe(
      gomokuGoal,
    );
  });
});
