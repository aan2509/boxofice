import { getTelegramBotSettingsSafe } from "@/lib/telegram-bot-settings";
import { sendTelegramBotMessage } from "@/lib/telegram-bot-api";

export async function sendTelegramUserMessage(input: {
  telegramId: string | null | undefined;
  text: string;
}) {
  if (!input.telegramId) {
    return false;
  }

  const settings = await getTelegramBotSettingsSafe();

  if (!settings.runtime.botToken) {
    return false;
  }

  await sendTelegramBotMessage({
    botToken: settings.runtime.botToken,
    chatId: input.telegramId,
    text: input.text,
  });

  return true;
}
