import { NextResponse, type NextRequest } from "next/server";

import { getCronAuthorizationError } from "@/lib/cron-route";
import {
  resolveSyncPage,
  resolveSyncPages,
  syncAllMovieFeeds,
  syncMovieFeed,
} from "@/lib/movie-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authorizationError = getCronAuthorizationError(request);

  if (authorizationError) {
    return authorizationError;
  }

  try {
    const target = request.nextUrl.searchParams.get("target");
    const pageParam = request.nextUrl.searchParams.get("page");
    const pages = resolveSyncPages(request.nextUrl.searchParams.get("pages"));
    if (target === "home" || target === "popular" || target === "new") {
      const summary = pageParam
        ? await syncMovieFeed(target, { page: resolveSyncPage(pageParam) })
        : await syncMovieFeed(target, { pages });

      return NextResponse.json({
        ok: summary.errors.length === 0,
        page: summary.page,
        pages,
        summary,
      });
    }

    const summary = await syncAllMovieFeeds({ pages });
    const hasErrors = Object.values(summary.targets).some(
      (item) => item.errors.length > 0,
    );

    return NextResponse.json({
      ok: !hasErrors,
      pages,
      summary,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Sync failed",
      },
      { status: 502 },
    );
  }
}
