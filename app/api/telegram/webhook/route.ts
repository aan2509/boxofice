import { NextResponse, type NextRequest } from "next/server";

import { registerAffiliateClick } from "@/lib/affiliate";
import {
  buildTelegramMiniAppUrl,
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

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-telegram-bot-api-secret-token");

  if (secret !== getTelegramWebhookSecret()) {
    return NextResponse.json({ error: "Webhook secret tidak valid." }, { status: 401 });
  }

  const update = (await request.json().catch(() => null)) as TelegramUpdate | null;
  const chatId = update?.message?.chat?.id;
  const startPayload = parseStartPayload(update?.message?.text);
  const referralCode = extractAffiliateCodeFromStartParam(startPayload);

  if (referralCode) {
    await registerAffiliateClick(referralCode).catch(() => undefined);
  }

  if (typeof chatId === "number") {
    const miniAppUrl = buildTelegramMiniAppUrl(startPayload);

    await callTelegramBotApi("sendMessage", {
      chat_id: chatId,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Buka Box Office",
              url: miniAppUrl,
            },
          ],
        ],
      },
      text:
        "Box Office siap dibuka. Tekan tombol di bawah untuk masuk ke Mini App dengan akun Telegram kamu.",
    }).catch((error) => {
      console.error("Telegram webhook sendMessage failed", error);
    });
  }

  return NextResponse.json({ ok: true });
}
