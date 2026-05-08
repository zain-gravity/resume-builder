// next-intl 3.17.x — no defineRouting, use plain arrays
export const locales = [
  "en", "es", "fr", "de", "pt", "it", "nl", "ru", "pl", "tr",
  "ar", "zh", "ja", "ko", "hi", "id", "vi", "th", "ms", "sv",
  "da", "no", "fi", "cs", "el",
] as const;

export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
