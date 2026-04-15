import type { Metadata } from "next";
import { cookies } from "next/headers";
import Script from "next/script";

import { HapticFeedback } from "@/components/feedback/haptic-feedback";
import { MobileBottomNav } from "@/components/navigation/mobile-bottom-nav";
import { TelegramAppChrome } from "@/components/telegram/telegram-app-chrome";
import { TelegramSessionSync } from "@/components/telegram/telegram-session-sync";
import { USER_SESSION_COOKIE } from "@/lib/user-auth";
import "./globals.css";

function normalizeAppUrl(value: string | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

const appUrl =
  normalizeAppUrl(process.env.NEXT_PUBLIC_APP_URL) ||
  normalizeAppUrl(process.env.APP_URL) ||
  normalizeAppUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
  normalizeAppUrl(process.env.VERCEL_URL) ||
  "https://boxofice.vercel.app";

export const metadata: Metadata = {
  metadataBase: appUrl ? new URL(appUrl) : undefined,
  applicationName: "Layar BoxOffice",
  title: {
    default: "Layar BoxOffice",
    template: "%s | Layar BoxOffice",
  },
  description:
    "Layar BoxOffice adalah Mini App Telegram untuk nonton film Box Office, cari judul favorit, buka akses VIP, dan jalankan affiliate langsung dari Telegram.",
  openGraph: {
    description:
      "Nonton film Box Office langsung dari Telegram. Full HD, update harian, VIP, dan affiliate dalam satu Mini App.",
    siteName: "Layar BoxOffice",
    title: "Layar BoxOffice",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    description:
      "Nonton film Box Office langsung dari Telegram dengan akses VIP dan sistem affiliate di Layar BoxOffice.",
    title: "Layar BoxOffice",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const hasUserSession = Boolean(cookieStore.get(USER_SESSION_COOKIE)?.value);

  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        <TelegramAppChrome />
        <TelegramSessionSync />
        <HapticFeedback />
        {hasUserSession ? <MobileBottomNav /> : null}
        <Script
          src="https://telegram.org/js/telegram-web-app.js?57"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
