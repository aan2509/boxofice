import { NextResponse, type NextRequest } from "next/server";

import { registerAffiliateClick } from "@/lib/affiliate";
import { getTelegramBotSettingsSafe } from "@/lib/telegram-bot-settings";
import {
  buildAffiliateStartParam,
  buildTelegramBotChatUrlForUsername,
} from "@/lib/telegram-miniapp";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ReferralRouteContext = {
  params: Promise<{
    code: string;
  }>;
};

export async function GET(
  _request: NextRequest,
  { params }: ReferralRouteContext,
) {
  const { code } = await params;
  const normalizedCode = code.trim().toUpperCase();

  if (normalizedCode) {
    await registerAffiliateClick(normalizedCode).catch(() => undefined);
  }

  const telegram = await getTelegramBotSettingsSafe();

  return NextResponse.redirect(
    buildTelegramBotChatUrlForUsername(
      telegram.runtime.botUsername,
      buildAffiliateStartParam(normalizedCode),
    ),
  );
}
