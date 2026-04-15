import { getTelegramBotSettingsSafe } from "@/lib/telegram-bot-settings";
import { sendTelegramBotMessage } from "@/lib/telegram-bot-api";

export async function sendTelegramRuntimeMessage(input: {
  botToken?: string | null;
  telegramId: string | null | undefined;
  replyMarkup?: Record<string, unknown>;
  text: string;
}) {
  if (!input.telegramId) {
    return false;
  }

  const settings = await getTelegramBotSettingsSafe();
  const botToken = input.botToken?.trim() || settings.runtime.botToken;

  if (!botToken) {
    return false;
  }

  await sendTelegramBotMessage({
    botToken,
    chatId: input.telegramId,
    replyMarkup: input.replyMarkup,
    text: input.text,
  });

  return true;
}

export async function sendTelegramUserMessage(input: {
  telegramId: string | null | undefined;
  text: string;
}) {
  return sendTelegramRuntimeMessage(input);
}
