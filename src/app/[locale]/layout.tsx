import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales, defaultLocale } from "@/i18n/routing";
import "@/app/globals.css";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  title: { default: "ResumeAI — Free AI Resume Builder", template: "%s | ResumeAI" },
  description: "Build a professional, ATS-optimized resume in minutes with AI. 100% free, no watermarks, no paywalls.",
  keywords: ["resume builder", "free resume", "AI resume", "ATS resume", "CV builder"],
  manifest: "/manifest.json",
  openGraph: {
    title: "ResumeAI — Free AI Resume Builder",
    description: "Build a professional resume in minutes with AI. 100% free forever.",
    type: "website",
    siteName: "ResumeAI",
  },
  twitter: { card: "summary_large_image", title: "ResumeAI", description: "Free AI Resume Builder" },
  robots: { index: true, follow: true },
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!locales.includes(locale as "en")) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&family=Open+Sans:wght@300;400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
