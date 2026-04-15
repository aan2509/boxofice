import { NextResponse, type NextRequest } from "next/server";

import {
  registerAffiliateClick,
  saveTelegramReferralIntent,
} from "@/lib/affiliate";
import {
  getTelegramBotSettingsSafe,
} from "@/lib/telegram-bot-settings";
import {
  extractAffiliateCodeFromStartParam,
} from "@/lib/telegram-miniapp";
import {
  isStartCommand,
  parseStartPayload,
  sendTelegramWelcomeMessage,
} from "@/lib/telegram-webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TelegramUpdate = {
  message?: {
    chat?: {
      id?: number;
    };
    from?: {
      first_name?: string;
      id?: number;
      username?: string;
    };
    text?: string;
  };
};

export async function POST(request: NextRequest) {
  const botSettings = await getTelegramBotSettingsSafe();

  if (!botSettings.runtime.webhookSecret || !botSettings.runtime.botToken) {
    return NextResponse.json(
      { error: "Konfigurasi bot Telegram belum lengkap." },
      { status: 500 },
    );
  }

  const secret = request.headers.get("x-telegram-bot-api-secret-token");

  if (secret !== botSettings.runtime.webhookSecret) {
    return NextResponse.json({ error: "Webhook secret tidak valid." }, { status: 401 });
  }

  const update = (await request.json().catch(() => null)) as TelegramUpdate | null;
  const isStart = isStartCommand(update?.message?.text);

  if (!isStart) {
    return NextResponse.json({ ok: true, skipped: "not_start" });
  }

  const chatId = update?.message?.chat?.id;
  const startPayload = parseStartPayload(update?.message?.text);
  const referralCode = extractAffiliateCodeFromStartParam(startPayload);

  if (referralCode) {
    await registerAffiliateClick(referralCode).catch(() => undefined);
    await saveTelegramReferralIntent({
      referralCode,
      telegramId: update?.message?.from?.id,
    }).catch(() => undefined);
  }

  if (typeof chatId === "number") {
    await sendTelegramWelcomeMessage({
      botToken: botSettings.runtime.botToken,
      message: {
        chatId,
        firstName: update?.message?.from?.first_name,
        telegramId: update?.message?.from?.id,
        username: update?.message?.from?.username,
      },
      settings: botSettings.settings,
      startParam: startPayload,
    }).catch((error) => {
      console.error("Telegram webhook sendMessage failed", error);
    });
  }

  return NextResponse.json({ ok: true });
}
