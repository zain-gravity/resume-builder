import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "./i18n/routing";

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
});

export const config = {
  matcher: [
    "/",
    "/(en|es|fr|de|pt|it|nl|ru|pl|tr|ar|zh|ja|ko|hi|id|vi|th|ms|sv|da|no|fi|cs|el)/:path*",
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
