import { useCallback, useEffect, useState } from "react";
import { useSettings } from "@/hooks/useSettings";
import {
  loadGameContentTranslations,
  translate,
  translateTemplate,
  translateText,
  type GameContentTranslations,
  type TranslationKey,
} from "@/lib/i18n";

export default function useTranslation() {
  const { settings } = useSettings();
  const [loadedContent, setLoadedContent] = useState<{
    language: string;
    translations: GameContentTranslations;
  } | null>(null);

  useEffect(() => {
    if (settings.language === "en") return;
    let active = true;
    void loadGameContentTranslations(settings.language)
      .then((translations) => {
        if (active)
          setLoadedContent({ language: settings.language, translations });
      })
      .catch((error: unknown) => {
        console.error(
          `Failed to load ${settings.language} game translations.`,
          error,
        );
      });
    return () => {
      active = false;
    };
  }, [settings.language]);

  const t = useCallback(
    (key: TranslationKey, values?: Record<string, string>) =>
      values
        ? translateTemplate(settings.language, key, values)
        : translate(settings.language, key),
    [settings.language],
  );
  const tText = useCallback(
    (text: string, values?: Record<string, string>) =>
      translateText(
        settings.language,
        text,
        values,
        loadedContent?.language === settings.language
          ? loadedContent.translations
          : {},
      ),
    [loadedContent, settings.language],
  );

  return { t, tText, language: settings.language };
}
