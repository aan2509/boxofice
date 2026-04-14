import { prisma } from "@/lib/prisma";
import {
  buildTelegramBotChatUrl,
  buildTelegramMiniAppUrl,
} from "@/lib/telegram-miniapp";

export type TelegramBotSettingsSnapshot = {
  affiliateGroupLabel: string;
  affiliateGroupUrl: string;
  affiliateLabel: string;
  affiliateUrl: string;
  channelLabel: string;
  channelUrl: string;
  createdAt: Date;
  id: string;
  openAppLabel: string;
  openAppUrl: string;
  searchLabel: string;
  searchUrl: string;
  slug: string;
  supportLabel: string;
  supportUrl: string;
  updatedAt: Date;
  vipLabel: string;
  vipUrl: string;
  welcomeMessage: string;
};

export type TelegramBotSettingsResult = {
  schemaIssue: string | null;
  schemaReady: boolean;
  settings: TelegramBotSettingsSnapshot;
};

function isRecordWithCode(
  error: unknown,
): error is { code?: string; message?: string } {
  return typeof error === "object" && error !== null;
}

function isMissingTelegramBotSchemaError(error: unknown) {
  if (!isRecordWithCode(error)) {
    return false;
  }

  if (error.code !== "P2021" && error.code !== "P2022") {
    return false;
  }

  return typeof error.message === "string" && error.message.includes("TelegramBotSettings");
}

function getPublicAppUrl() {
  const value =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    process.env.VERCEL_URL?.trim() ||
    "";

  if (!value) {
    return "https://example.com";
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value.replace(/\/+$/, "");
  }

  return `https://${value.replace(/\/+$/, "")}`;
}

function createDefaultTelegramBotSettings(): TelegramBotSettingsSnapshot {
  const appUrl = getPublicAppUrl();

  return {
    affiliateGroupLabel: "🏠 Group Affiliate",
    affiliateGroupUrl: buildTelegramBotChatUrl(),
    affiliateLabel: "💰 Gabung Affiliate",
    affiliateUrl: `${appUrl}/affiliate`,
    channelLabel: "🎥 Film Box Office",
    channelUrl: buildTelegramBotChatUrl(),
    createdAt: new Date(0),
    id: "telegram-bot-settings-fallback",
    openAppLabel: "🎬 Buka",
    openAppUrl: buildTelegramMiniAppUrl(),
    searchLabel: "🔎 Cari Judul",
    searchUrl: `${appUrl}/search`,
    slug: "default",
    supportLabel: "📞 Hubungi Admin",
    supportUrl: buildTelegramBotChatUrl(),
    updatedAt: new Date(0),
    vipLabel: "💎 Join VIP",
    vipUrl: buildTelegramMiniAppUrl(),
    welcomeMessage:
      "👋 Hai {first_name}! Selamat datang di Box Office.\n\n🎬 Nonton film Box Office langsung dari Telegram.\n🔥 Tanpa ribet • Full HD • Update setiap hari\n\n📌 Cara pakai:\n• Buka -> langsung mulai nonton\n• Cari Judul -> cari film favoritmu\n• Gabung Affiliate -> mulai bangun komisi dari Telegram\n• Film Box Office -> lihat update kanal utama\n• Hubungi Admin -> kalau ada kendala\n• Join VIP -> buka akses premium\n\nPilih menu di bawah dan mulai sekarang!",
  };
}

export async function ensureTelegramBotSettings() {
  const existing = await prisma.telegramBotSettings.findUnique({
    where: { slug: "default" },
  });

  if (existing) {
    return existing;
  }

  const defaults = createDefaultTelegramBotSettings();

  return prisma.telegramBotSettings.create({
    data: {
      affiliateGroupLabel: defaults.affiliateGroupLabel,
      affiliateGroupUrl: defaults.affiliateGroupUrl,
      affiliateLabel: defaults.affiliateLabel,
      affiliateUrl: defaults.affiliateUrl,
      channelLabel: defaults.channelLabel,
      channelUrl: defaults.channelUrl,
      openAppLabel: defaults.openAppLabel,
      openAppUrl: defaults.openAppUrl,
      searchLabel: defaults.searchLabel,
      searchUrl: defaults.searchUrl,
      supportLabel: defaults.supportLabel,
      supportUrl: defaults.supportUrl,
      vipLabel: defaults.vipLabel,
      vipUrl: defaults.vipUrl,
      welcomeMessage: defaults.welcomeMessage,
    },
  });
}

export async function getTelegramBotSettingsSafe(): Promise<TelegramBotSettingsResult> {
  try {
    const settings = await ensureTelegramBotSettings();

    return {
      schemaIssue: null,
      schemaReady: true,
      settings,
    };
  } catch (error) {
    if (!isMissingTelegramBotSchemaError(error)) {
      throw error;
    }

    return {
      schemaIssue:
        "Tabel Telegram bot settings belum ada di database runtime. Jalankan migration terbaru agar pengaturan bot aktif penuh.",
      schemaReady: false,
      settings: createDefaultTelegramBotSettings(),
    };
  }
}

export function renderTelegramWelcomeMessage(
  template: string,
  input: {
    firstName?: string | null;
    username?: string | null;
  },
) {
  return template
    .replace(/\{first_name\}/gi, input.firstName?.trim() || "teman")
    .replace(
      /\{username\}/gi,
      input.username?.trim() ? `@${input.username.trim().replace(/^@/, "")}` : "teman",
    );
}
