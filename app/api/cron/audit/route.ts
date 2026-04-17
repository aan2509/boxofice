import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

import { getCronAuthorizationError } from "@/lib/cron-route";
import {
  auditMovieCatalogBatch,
  type CombinedAuditSummary,
  type FeedAuditSummary,
  type MovieAuditTarget,
} from "@/lib/movie-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_BATCH_SIZE = 12;
const MAX_BATCH_SIZE = 50;

function resolveAuditTarget(value: string | null): MovieAuditTarget {
  return value === "home" || value === "popular" || value === "new" || value === "all"
    ? value
    : "all";
}

function resolveBatchSize(value: string | null) {
  const parsed = value ? Number(value) : DEFAULT_BATCH_SIZE;
  const safeValue = Number.isFinite(parsed) ? Math.trunc(parsed) : DEFAULT_BATCH_SIZE;

  return Math.min(Math.max(safeValue, 1), MAX_BATCH_SIZE);
}

function resolveAutoHide(value: string | null) {
  if (value === null) {
    return true;
  }

  return value !== "false" && value !== "0";
}

function createFeedAccumulator(target: "home" | "popular" | "new"): FeedAuditSummary {
  return {
    target,
    checked: 0,
    playable: 0,
    broken: 0,
    hidden: 0,
    refreshed: 0,
    errors: [],
  };
}

function mergeFeedSummary(
  accumulator: FeedAuditSummary,
  summary: FeedAuditSummary,
) {
  accumulator.checked += summary.checked;
  accumulator.playable += summary.playable;
  accumulator.broken += summary.broken;
  accumulator.hidden += summary.hidden;
  accumulator.refreshed += summary.refreshed;
  accumulator.errors.push(...summary.errors);
}

function createCombinedAccumulator(): CombinedAuditSummary {
  return {
    totalChecked: 0,
    totalPlayable: 0,
    totalBroken: 0,
    totalHidden: 0,
    totalRefreshed: 0,
    totalErrors: 0,
    errors: [],
    targets: {
      home: createFeedAccumulator("home"),
      popular: createFeedAccumulator("popular"),
      new: createFeedAccumulator("new"),
    },
  };
}

function mergeBatchSummary(
  accumulator: CombinedAuditSummary,
  summary: FeedAuditSummary | CombinedAuditSummary,
  target: MovieAuditTarget,
) {
  if (target === "all") {
    const combined = summary as CombinedAuditSummary;

    accumulator.totalChecked += combined.totalChecked;
    accumulator.totalPlayable += combined.totalPlayable;
    accumulator.totalBroken += combined.totalBroken;
    accumulator.totalHidden += combined.totalHidden;
    accumulator.totalRefreshed += combined.totalRefreshed;
    accumulator.totalErrors += combined.totalErrors;
    accumulator.errors.push(...combined.errors);
    mergeFeedSummary(accumulator.targets.home, combined.targets.home);
    mergeFeedSummary(accumulator.targets.popular, combined.targets.popular);
    mergeFeedSummary(accumulator.targets.new, combined.targets.new);
    return;
  }

  const feed = summary as FeedAuditSummary;
  accumulator.totalChecked += feed.checked;
  accumulator.totalPlayable += feed.playable;
  accumulator.totalBroken += feed.broken;
  accumulator.totalHidden += feed.hidden;
  accumulator.totalRefreshed += feed.refreshed;
  accumulator.totalErrors += feed.errors.length;
  accumulator.errors.push(...feed.errors);
  mergeFeedSummary(accumulator.targets[target], feed);
}

export async function GET(request: NextRequest) {
  const authorizationError = getCronAuthorizationError(request);

  if (authorizationError) {
    return authorizationError;
  }

  try {
    const target = resolveAuditTarget(request.nextUrl.searchParams.get("target"));
    const batchSize = resolveBatchSize(request.nextUrl.searchParams.get("batchSize"));
    const autoHide = resolveAutoHide(request.nextUrl.searchParams.get("autoHide"));
    const summary = createCombinedAccumulator();
    let batchCount = 0;
    let cursor: string | null = null;
    let total = 0;

    while (true) {
      const result = await auditMovieCatalogBatch(target, {
        autoHide,
        batchSize,
        cursor,
      });

      mergeBatchSummary(summary, result.summary, target);
      batchCount += 1;
      total = result.total;

      if (!result.hasMore || !result.nextCursor) {
        break;
      }

      cursor = result.nextCursor;
    }

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
      autoHide,
      batchCount,
      batchSize,
      summary,
      target,
      total,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Audit failed",
      },
      { status: 502 },
    );
  }
}
