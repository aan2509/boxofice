import { sendTelegramBotMessage } from "@/lib/telegram-bot-api";
import {
  renderTelegramWelcomeMessage,
  type TelegramBotSettingsSnapshot,
} from "@/lib/telegram-bot-settings";

export type TelegramStartMessage = {
  chatId: number | null;
  firstName?: string;
  telegramId?: number;
  text?: string;
  username?: string;
};

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

export function parseStartPayload(messageText: string | undefined) {
  const text = messageText?.trim();

  if (!text || !text.startsWith("/start")) {
    return null;
  }

  const [, payload] = text.split(/\s+/, 2);

  return payload?.trim() || null;
}

export function isStartCommand(messageText: string | undefined) {
  return messageText?.trim().startsWith("/start") ?? false;
}

export function appendStartParam(urlValue: string, startParam: string | null) {
  if (!startParam) {
    return urlValue;
  }

  try {
    const url = new URL(urlValue);

    url.searchParams.set("start_param", startParam);

    return url.toString();
  } catch {
    return urlValue;
  }
}

export function buildTelegramInlineKeyboard(
  settings: TelegramBotSettingsSnapshot,
  startParam: string | null,
) {
  const openAppUrl = sanitizeAbsoluteUrl(settings.openAppUrl);
  const searchUrl = sanitizeAbsoluteUrl(settings.searchUrl);
  const affiliateUrl = sanitizeAbsoluteUrl(settings.affiliateUrl);
  const affiliateGroupUrl = sanitizeAbsoluteUrl(settings.affiliateGroupUrl);
  const channelUrl = sanitizeAbsoluteUrl(settings.channelUrl);
  const supportUrl = sanitizeAbsoluteUrl(settings.supportUrl);
  const vipUrl = sanitizeAbsoluteUrl(settings.vipUrl);

  return [
    openAppUrl
      ? [
          createWebAppButton(
            settings.openAppLabel,
            appendStartParam(openAppUrl, startParam),
          ),
        ]
      : [],
    searchUrl
      ? [
          createWebAppButton(
            settings.searchLabel,
            appendStartParam(searchUrl, startParam),
          ),
        ]
      : [],
    affiliateUrl
      ? [
          createWebAppButton(
            settings.affiliateLabel,
            appendStartParam(affiliateUrl, startParam),
          ),
        ]
      : [],
    [
      affiliateGroupUrl
        ? createUrlButton(settings.affiliateGroupLabel, affiliateGroupUrl)
        : null,
      channelUrl ? createUrlButton(settings.channelLabel, channelUrl) : null,
    ].filter(Boolean),
    [
      supportUrl ? createUrlButton(settings.supportLabel, supportUrl) : null,
      vipUrl
        ? createWebAppButton(
            settings.vipLabel,
            appendStartParam(vipUrl, startParam),
          )
        : null,
    ].filter(Boolean),
  ].filter((row) => row.length > 0);
}

export async function sendTelegramWelcomeMessage(input: {
  botToken: string;
  message: TelegramStartMessage;
  settings: TelegramBotSettingsSnapshot;
  startParam: string | null;
}) {
  if (!input.message.chatId) {
    return false;
  }

  const text = renderTelegramWelcomeMessage(input.settings.welcomeMessage, {
    firstName: input.message.firstName,
    username: input.message.username,
  });

  await sendTelegramBotMessage({
    botToken: input.botToken,
    chatId: input.message.chatId,
    replyMarkup: {
      inline_keyboard: buildTelegramInlineKeyboard(
        input.settings,
        input.startParam,
      ),
    },
    text,
  });

  return true;
}
