import { NextResponse, type NextRequest } from "next/server";

import {
  attachAffiliateReferral,
  consumeTelegramReferralIntent,
  registerAffiliateClick,
} from "@/lib/affiliate";
import { getTelegramBotSettingsSafe } from "@/lib/telegram-bot-settings";
import {
  extractAffiliateCodeFromStartParam,
  validateTelegramInitData,
} from "@/lib/telegram-miniapp";
import { createUserSession, upsertTelegramUser } from "@/lib/user-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TelegramAuthRequestBody = {
  initData?: unknown;
  startParam?: unknown;
};

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | TelegramAuthRequestBody
    | null;
  const initData =
    typeof body?.initData === "string" ? body.initData.trim() : "";

  if (!initData) {
    return NextResponse.json(
      { error: "initData Telegram wajib diisi." },
      { status: 400 },
    );
  }

  try {
    const botSettings = await getTelegramBotSettingsSafe();

    if (!botSettings.runtime.botToken) {
      throw new Error("Bot token Telegram belum diatur di database maupun env.");
    }

    const telegram = validateTelegramInitData(
      initData,
      botSettings.runtime.botToken,
    );
    const user = await upsertTelegramUser(telegram);
    const fallbackStartParam =
      typeof body?.startParam === "string" ? body.startParam.trim() : "";
    const referralCodeFromInitData = extractAffiliateCodeFromStartParam(
      telegram.startParam,
    );
    const referralCodeFromUrl =
      extractAffiliateCodeFromStartParam(fallbackStartParam);
    const referralCodeFromIntent =
      !referralCodeFromInitData && !referralCodeFromUrl
        ? await consumeTelegramReferralIntent({ telegramId: telegram.user.id })
        : null;
    const referralCode =
      referralCodeFromInitData ?? referralCodeFromUrl ?? referralCodeFromIntent;

    if (referralCode) {
      if (referralCodeFromInitData || referralCodeFromUrl) {
        await registerAffiliateClick(referralCode).catch(() => undefined);
      }

      await attachAffiliateReferral({
        referralCode,
        referredUserId: user.id,
      }).catch(() => undefined);
    }

    await createUserSession(user);

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        telegramUsername: user.telegramUsername,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Autentikasi Telegram gagal.",
      },
      { status: 401 },
    );
  }
}
