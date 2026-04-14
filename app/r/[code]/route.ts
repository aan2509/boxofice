import { NextResponse, type NextRequest } from "next/server";

import { registerAffiliateClick } from "@/lib/affiliate";
import {
  buildAffiliateStartParam,
  buildTelegramBotChatUrl,
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

  return NextResponse.redirect(
    buildTelegramBotChatUrl(buildAffiliateStartParam(normalizedCode)),
  );
}
