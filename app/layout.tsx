import type { Metadata } from "next";
import Script from "next/script";

import { MobileBottomNav } from "@/components/navigation/mobile-bottom-nav";
import { getCurrentUserSession } from "@/lib/user-auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Box Office",
  description: "A metadata-first movie streaming app.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUserSession();

  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        {user ? <MobileBottomNav /> : null}
        <Script
          src="https://telegram.org/js/telegram-web-app.js?57"
          strategy="beforeInteractive"
        />
      </body>
    </html>
  );
}
