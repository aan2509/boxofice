import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

import { getCronAuthorizationError } from "@/lib/cron-route";
import {
  resolveSyncPage,
  type FeedSyncSummary,
  syncMovieFeed,
  type MovieFeedTarget,
} from "@/lib/movie-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_FROM_PAGE = 1;
const DEFAULT_TO_PAGE = 50;

function resolveTarget(value: string | null): MovieFeedTarget | "all" {
  return value === "home" || value === "popular" || value === "new" || value === "all"
    ? value
    : "all";
}

function resolveFromPage(value: string | null) {
  return resolveSyncPage(value ?? DEFAULT_FROM_PAGE);
}

function resolveToPage(value: string | null, fromPage: number) {
  return Math.max(fromPage, resolveSyncPage(value ?? DEFAULT_TO_PAGE));
}

function createFeedAccumulator(
  target: MovieFeedTarget,
  pages: number,
): FeedSyncSummary {
  return {
    target,
    pages,
    fetched: 0,
    created: 0,
    existing: 0,
    updated: 0,
    unchanged: 0,
    upserted: 0,
    duplicateSkipped: 0,
    skippedUnsupported: 0,
    deactivated: 0,
    hadFetchErrors: false,
    active: 0,
    errors: [],
  };
}

function mergeFeedSyncSummary(
  accumulator: FeedSyncSummary,
  summary: FeedSyncSummary,
) {
  accumulator.fetched += summary.fetched;
  accumulator.created += summary.created;
  accumulator.existing += summary.existing;
  accumulator.updated += summary.updated;
  accumulator.unchanged += summary.unchanged;
  accumulator.upserted += summary.upserted;
  accumulator.duplicateSkipped += summary.duplicateSkipped;
  accumulator.skippedUnsupported += summary.skippedUnsupported;
  accumulator.deactivated += summary.deactivated;
  accumulator.active += summary.active;
  accumulator.hadFetchErrors = accumulator.hadFetchErrors || summary.hadFetchErrors;
  accumulator.errors.push(...summary.errors);
}

async function syncTargetRange(
  target: MovieFeedTarget,
  fromPage: number,
  toPage: number,
) {
  const pages = toPage - fromPage + 1;
  const summary = createFeedAccumulator(target, pages);

  for (let page = fromPage; page <= toPage; page += 1) {
    const pageSummary = await syncMovieFeed(target, { page });
    mergeFeedSyncSummary(summary, pageSummary);
  }

  return summary;
}

export async function GET(request: NextRequest) {
  const authorizationError = getCronAuthorizationError(request);

  if (authorizationError) {
    return authorizationError;
  }

  try {
    const target = resolveTarget(request.nextUrl.searchParams.get("target"));
    const fromPage = resolveFromPage(request.nextUrl.searchParams.get("fromPage"));
    const toPage = resolveToPage(request.nextUrl.searchParams.get("toPage"), fromPage);
    const targets: MovieFeedTarget[] =
      target === "all" ? ["home", "popular", "new"] : [target];
    const summaries: FeedSyncSummary[] = [];

    for (const item of targets) {
      summaries.push(await syncTargetRange(item, fromPage, toPage));
    }

    const targetSummaries: Partial<Record<MovieFeedTarget, FeedSyncSummary>> = {};

    for (const item of summaries) {
      targetSummaries[item.target] = item;
    }

    const summary = {
      fromPage,
      toPage,
      targets: targetSummaries,
      totalFetched: summaries.reduce((sum, item) => sum + item.fetched, 0),
      totalCreated: summaries.reduce((sum, item) => sum + item.created, 0),
      totalExisting: summaries.reduce((sum, item) => sum + item.existing, 0),
      totalUpdated: summaries.reduce((sum, item) => sum + item.updated, 0),
      totalUnchanged: summaries.reduce((sum, item) => sum + item.unchanged, 0),
      totalUpserted: summaries.reduce((sum, item) => sum + item.upserted, 0),
      totalDuplicateSkipped: summaries.reduce(
        (sum, item) => sum + item.duplicateSkipped,
        0,
      ),
      totalSkippedUnsupported: summaries.reduce(
        (sum, item) => sum + item.skippedUnsupported,
        0,
      ),
      totalDeactivated: summaries.reduce((sum, item) => sum + item.deactivated, 0),
      totalErrors: summaries.reduce((sum, item) => sum + item.errors.length, 0),
    };

    revalidatePath("/");
    revalidatePath("/search");
    revalidatePath("/library");
    revalidatePath("/browse/home");
    revalidatePath("/browse/populer");
    revalidatePath("/browse/new");
    revalidatePath("/movie/[id]", "page");
    revalidatePath("/admin");
    revalidatePath("/admin/sync");

    return NextResponse.json({
      ok: summary.totalErrors === 0,
      summary,
      target,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Nightly sync failed",
      },
      { status: 502 },
    );
  }
}
