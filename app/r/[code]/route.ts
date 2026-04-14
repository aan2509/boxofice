import { NextResponse, type NextRequest } from "next/server";

import { registerAffiliateClick } from "@/lib/affiliate";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ReferralRouteContext = {
  params: Promise<{
    code: string;
  }>;
};

export async function GET(
  request: NextRequest,
  { params }: ReferralRouteContext,
) {
  const { code } = await params;
  const normalizedCode = code.trim().toUpperCase();

  if (normalizedCode) {
    await registerAffiliateClick(normalizedCode).catch(() => undefined);
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/signup";
  redirectUrl.search = `?ref=${encodeURIComponent(normalizedCode)}`;

  return NextResponse.redirect(redirectUrl);
}
