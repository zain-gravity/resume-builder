import { getRequestConfig } from "next-intl/server";
import { locales, defaultLocale, type Locale } from "./routing";

export default getRequestConfig(async ({ locale }) => {
  const safeLocale: Locale = locales.includes(locale as Locale)
    ? (locale as Locale)
    : defaultLocale;

  return {
    messages: (await import(`../../messages/${safeLocale}.json`)).default,
  };
});
