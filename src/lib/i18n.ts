import type { Language } from "@/lib/settings";

export const supportedLanguages: readonly { value: Language; label: string }[] =
  [
    { value: "en", label: "English" },
    { value: "fr", label: "Français" },
    { value: "it", label: "Italiano" },
    { value: "es", label: "Español" },
    { value: "pt", label: "Português" },
    { value: "nl", label: "Nederlands" },
    { value: "zh", label: "中文" },
    { value: "hi", label: "हिन्दी" },
    { value: "de", label: "Deutsch" },
    { value: "sv", label: "Svenska" },
    { value: "ja", label: "日本語" },
  ];

const translations = {
  "nav.games": "Games",
  "nav.social": "Social",
  "nav.shop": "Shop",
  "nav.settings": "Settings",
  "nav.profile": "Profile",
  "common.back": "Go back",
  "home.tagline": "Board games you love",
  "home.play": "Play",
  "home.login": "Log in / Sign up",
  "home.campaigns": "Campaigns and daily challenges",
  "home.loading": "Loading events…",
  "home.dailyChallenge": "Daily challenge",
  "home.campaign": "Campaign",
  "games.choose": "Choose a game",
  "games.enjoy": "Enjoy",
  "games.none": "No games are available for {nation} yet.",
  "settings.language": "Language",
  "settings.languageDescription":
    "Choose the language used throughout the app.",
  "settings.title": "Settings",
} as const;

export type TranslationKey = keyof typeof translations;
export type GameContentTranslations = Readonly<Record<string, string>>;

export function translate(_language: Language, key: TranslationKey): string {
  return translations[key];
}

export function translateTemplate(
  language: Language,
  key: TranslationKey,
  values: Record<string, string>,
): string {
  return Object.entries(values).reduce(
    (message, [name, value]) => message.split(`{${name}}`).join(value),
    translate(language, key),
  );
}

export function translateText(
  language: Language,
  text: string,
  values?: Record<string, string>,
  gameContent: GameContentTranslations = {},
): string {
  const message = gameContent[text] ?? text;
  return values
    ? Object.entries(values).reduce(
        (result, [name, value]) => result.split(`{${name}}`).join(value),
        message,
      )
    : message;
}

export async function loadGameContentTranslations(
  language: Exclude<Language, "en">,
): Promise<GameContentTranslations> {
  switch (language) {
    case "fr":
      return (await import("@/games/translations/fr")).gameContentTranslations;
    case "it":
      return (await import("@/games/translations/it")).gameContentTranslations;
    case "es":
      return (await import("@/games/translations/es")).gameContentTranslations;
    case "pt":
      return (await import("@/games/translations/pt")).gameContentTranslations;
    case "nl":
      return (await import("@/games/translations/nl")).gameContentTranslations;
    case "zh":
      return (await import("@/games/translations/zh")).gameContentTranslations;
    case "hi":
      return (await import("@/games/translations/hi")).gameContentTranslations;
    case "de":
      return (await import("@/games/translations/de")).gameContentTranslations;
    case "sv":
      return (await import("@/games/translations/sv")).gameContentTranslations;
    case "ja":
      return (await import("@/games/translations/ja")).gameContentTranslations;
  }
}
