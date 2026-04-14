import { NextResponse, type NextRequest } from "next/server";

import { attachAffiliateReferral, registerAffiliateClick } from "@/lib/affiliate";
import {
  extractAffiliateCodeFromStartParam,
  validateTelegramInitData,
} from "@/lib/telegram-miniapp";
import { createUserSession, upsertTelegramUser } from "@/lib/user-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TelegramAuthRequestBody = {
  initData?: unknown;
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
    const telegram = validateTelegramInitData(initData);
    const user = await upsertTelegramUser(telegram);
    const referralCode = extractAffiliateCodeFromStartParam(telegram.startParam);

    if (referralCode) {
      await registerAffiliateClick(referralCode).catch(() => undefined);
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
