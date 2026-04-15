"use client";

import * as React from "react";
import { Download, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

function isIosDevice() {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandaloneDisplayMode() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (typeof navigator !== "undefined" &&
      "standalone" in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

function isTelegramMiniApp() {
  if (typeof window === "undefined") {
    return false;
  }

  return Boolean(
    (window as Window & { Telegram?: { WebApp?: unknown } }).Telegram?.WebApp,
  );
}

export function AddToHomeScreenCard() {
  const [deferredPrompt, setDeferredPrompt] =
    React.useState<BeforeInstallPromptEvent | null>(null);
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const [isInstalled, setIsInstalled] = React.useState(false);

  React.useEffect(() => {
    setIsInstalled(isStandaloneDisplayMode());

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }

    function onInstalled() {
      setDeferredPrompt(null);
      setIsInstalled(true);
      setFeedback("Aplikasi sudah ditambahkan ke layar utama.");
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function installApp() {
    if (isInstalled) {
      setFeedback("Layar BoxOffice sudah tersedia di layar utama perangkat ini.");
      return;
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice.catch(() => null);

      if (choice?.outcome === "accepted") {
        setFeedback("Sip, Layar BoxOffice sedang ditambahkan ke layar utama.");
      } else {
        setFeedback("Kamu bisa pasang lagi kapan saja dari tombol ini.");
      }

      setDeferredPrompt(null);
      return;
    }

    if (isTelegramMiniApp()) {
      setFeedback(
        "Kalau prompt belum muncul, buka menu Telegram atau browser lalu pilih Add to Home Screen.",
      );
      return;
    }

    if (isIosDevice()) {
      setFeedback(
        "Di iPhone atau iPad, buka menu Share lalu pilih Add to Home Screen.",
      );
      return;
    }

    setFeedback(
      "Buka menu browser lalu pilih Install app atau Add to Home Screen.",
    );
  }

  return (
    <div className="mt-4 rounded-[20px] border border-white/10 bg-white/[0.05] p-4">
      <p className="inline-flex items-center gap-2 text-sm font-semibold text-white">
        <Smartphone className="size-4 text-red-300" />
        Tambahkan ke homescreen
      </p>
      <p className="mt-2 text-sm leading-6 text-neutral-300">
        Pasang Layar BoxOffice ke layar utama supaya buka app terasa lebih cepat
        dan lebih mirip native app.
      </p>
      <Button
        type="button"
        onClick={() => void installApp()}
        data-haptic="light"
        className="mt-4 h-11 bg-red-600 text-white hover:bg-red-500"
      >
        <Download className="size-4" />
        {isInstalled ? "Sudah terpasang" : "Tambahkan sekarang"}
      </Button>
      {feedback ? (
        <p className="mt-3 text-sm leading-6 text-neutral-400">{feedback}</p>
      ) : null}
    </div>
  );
}
