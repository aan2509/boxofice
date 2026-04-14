import { NextResponse, type NextRequest } from "next/server";

import { registerAffiliateClick } from "@/lib/affiliate";
import {
  getTelegramBotSettingsSafe,
  renderTelegramWelcomeMessage,
} from "@/lib/telegram-bot-settings";
import {
  extractAffiliateCodeFromStartParam,
  getTelegramBotToken,
  getTelegramWebhookSecret,
} from "@/lib/telegram-miniapp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TelegramUpdate = {
  message?: {
    chat?: {
      id?: number;
    };
    from?: {
      first_name?: string;
      username?: string;
    };
    text?: string;
  };
};

async function callTelegramBotApi(method: string, payload: unknown) {
  const response = await fetch(
    `https://api.telegram.org/bot${getTelegramBotToken()}/${method}`,
    {
      body: JSON.stringify(payload),
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    },
  );

  if (!response.ok) {
    throw new Error(`Telegram Bot API ${method} gagal (${response.status})`);
  }
}

function parseStartPayload(messageText: string | undefined) {
  const text = messageText?.trim();

  if (!text || !text.startsWith("/start")) {
    return null;
  }

  const [, payload] = text.split(/\s+/, 2);

  return payload?.trim() || null;
}

function sanitizeAbsoluteUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed);

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

function createWebAppButton(text: string, url: string) {
  return {
    text,
    web_app: {
      url,
    },
  };
}

function createUrlButton(text: string, url: string) {
  return {
    text,
    url,
  };
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-telegram-bot-api-secret-token");

  if (secret !== getTelegramWebhookSecret()) {
    return NextResponse.json({ error: "Webhook secret tidak valid." }, { status: 401 });
  }

  const update = (await request.json().catch(() => null)) as TelegramUpdate | null;
  const chatId = update?.message?.chat?.id;
  const startPayload = parseStartPayload(update?.message?.text);
  const referralCode = extractAffiliateCodeFromStartParam(startPayload);
  const botSettings = await getTelegramBotSettingsSafe();

  if (referralCode) {
    await registerAffiliateClick(referralCode).catch(() => undefined);
  }

  if (typeof chatId === "number") {
    const settings = botSettings.settings;
    const openAppUrl = sanitizeAbsoluteUrl(settings.openAppUrl);
    const searchUrl = sanitizeAbsoluteUrl(settings.searchUrl);
    const affiliateUrl = sanitizeAbsoluteUrl(settings.affiliateUrl);
    const affiliateGroupUrl = sanitizeAbsoluteUrl(settings.affiliateGroupUrl);
    const channelUrl = sanitizeAbsoluteUrl(settings.channelUrl);
    const supportUrl = sanitizeAbsoluteUrl(settings.supportUrl);
    const vipUrl = sanitizeAbsoluteUrl(settings.vipUrl);
    const inlineKeyboard = [
      openAppUrl ? [createWebAppButton(settings.openAppLabel, openAppUrl)] : [],
      searchUrl ? [createWebAppButton(settings.searchLabel, searchUrl)] : [],
      affiliateUrl
        ? [createWebAppButton(settings.affiliateLabel, affiliateUrl)]
        : [],
      [
        affiliateGroupUrl
          ? createUrlButton(settings.affiliateGroupLabel, affiliateGroupUrl)
          : null,
        channelUrl ? createUrlButton(settings.channelLabel, channelUrl) : null,
      ].filter(Boolean),
      [
        supportUrl ? createUrlButton(settings.supportLabel, supportUrl) : null,
        vipUrl ? createWebAppButton(settings.vipLabel, vipUrl) : null,
      ].filter(Boolean),
    ].filter((row) => row.length > 0);
    const text = renderTelegramWelcomeMessage(settings.welcomeMessage, {
      firstName: update?.message?.from?.first_name,
      username: update?.message?.from?.username,
    });

    await callTelegramBotApi("sendMessage", {
      chat_id: chatId,
      reply_markup: {
        inline_keyboard: inlineKeyboard,
      },
      text,
    }).catch((error) => {
      console.error("Telegram webhook sendMessage failed", error);
    });
  }

  return NextResponse.json({ ok: true });
}
