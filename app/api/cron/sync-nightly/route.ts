import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

import { getCronAuthorizationError } from "@/lib/cron-route";
import {
  resolveSyncPage,
  type FeedSyncSummary,
  syncMovieFeed,
  type MovieFeedTarget,
} from "@/lib/movie-sync";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const DEFAULT_FROM_PAGE = 1;
const DEFAULT_TO_PAGE = 50;
const DEFAULT_CURSOR_SLUG = "movie-sync-nightly";

type SyncMode = "cursor" | "range";

type CursorState = {
  currentPage: number;
  currentTarget: MovieFeedTarget;
  fromPage: number;
  target: MovieFeedTarget | "all";
  toPage: number;
};

function resolveMode(value: string | null): SyncMode {
  return value === "range" ? "range" : "cursor";
}

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

function resolveCursorSlug(
  value: string | null,
  target: MovieFeedTarget | "all",
) {
  const rawValue = value?.trim().toLowerCase() ?? "";
  const sanitized = rawValue.replace(/[^a-z0-9_-]/g, "");

  if (sanitized) {
    return sanitized;
  }

  return target === "all" ? DEFAULT_CURSOR_SLUG : `${DEFAULT_CURSOR_SLUG}-${target}`;
}

function resolveTargetSequence(target: MovieFeedTarget | "all") {
  return target === "all" ? (["home", "popular", "new"] as MovieFeedTarget[]) : [target];
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeCursorState(
  value: unknown,
  target: MovieFeedTarget | "all",
  fromPage: number,
  toPage: number,
): CursorState {
  const targets = resolveTargetSequence(target);
  const fallbackTarget = targets[0];

  if (!isRecord(value)) {
    return {
      currentPage: fromPage,
      currentTarget: fallbackTarget,
      fromPage,
      target,
      toPage,
    };
  }

  const rawCurrentPage = Number(value.currentPage);
  const currentPage = Number.isFinite(rawCurrentPage)
    ? Math.min(Math.max(Math.trunc(rawCurrentPage), fromPage), toPage)
    : fromPage;
  const rawCurrentTarget = value.currentTarget;
  const currentTarget =
    typeof rawCurrentTarget === "string" && targets.includes(rawCurrentTarget as MovieFeedTarget)
      ? (rawCurrentTarget as MovieFeedTarget)
      : fallbackTarget;
  const rawTarget = value.target;

  if (rawTarget !== target) {
    return {
      currentPage: fromPage,
      currentTarget: fallbackTarget,
      fromPage,
      target,
      toPage,
    };
  }

  const rawFromPage = Number(value.fromPage);
  const rawToPage = Number(value.toPage);

  if (
    !Number.isFinite(rawFromPage) ||
    !Number.isFinite(rawToPage) ||
    Math.trunc(rawFromPage) !== fromPage ||
    Math.trunc(rawToPage) !== toPage
  ) {
    return {
      currentPage: fromPage,
      currentTarget: fallbackTarget,
      fromPage,
      target,
      toPage,
    };
  }

  return {
    currentPage,
    currentTarget,
    fromPage,
    target,
    toPage,
  };
}

async function readCursorState(slug: string) {
  const rows = await prisma.$queryRaw<Array<{ state: unknown }>>`
    SELECT "state"
    FROM "CronJobCursor"
    WHERE "slug" = ${slug}
    LIMIT 1
  `;

  return rows[0]?.state ?? null;
}

async function writeCursorState(slug: string, state: CursorState) {
  const payload = JSON.stringify(state);

  await prisma.$executeRaw`
    INSERT INTO "CronJobCursor" (
      "id",
      "slug",
      "state",
      "lastRunAt",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      ${crypto.randomUUID()},
      ${slug},
      ${payload}::jsonb,
      NOW(),
      NOW(),
      NOW()
    )
    ON CONFLICT ("slug")
    DO UPDATE SET
      "state" = ${payload}::jsonb,
      "lastRunAt" = NOW(),
      "updatedAt" = NOW()
  `;
}

function buildNextCursorState(state: CursorState): CursorState {
  const targets = resolveTargetSequence(state.target);
  const currentIndex = Math.max(targets.indexOf(state.currentTarget), 0);

  if (state.currentPage < state.toPage) {
    return {
      ...state,
      currentPage: state.currentPage + 1,
    };
  }

  if (currentIndex < targets.length - 1) {
    return {
      ...state,
      currentPage: state.fromPage,
      currentTarget: targets[currentIndex + 1],
    };
  }

  return {
    ...state,
    currentPage: state.fromPage,
    currentTarget: targets[0],
  };
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

function revalidateCatalogPages() {
  revalidatePath("/");
  revalidatePath("/search");
  revalidatePath("/library");
  revalidatePath("/browse/home");
  revalidatePath("/browse/populer");
  revalidatePath("/browse/new");
  revalidatePath("/movie/[id]", "page");
  revalidatePath("/admin");
  revalidatePath("/admin/sync");
}

async function handleCursorMode(request: NextRequest) {
  const target = resolveTarget(request.nextUrl.searchParams.get("target"));
  const fromPage = resolveFromPage(request.nextUrl.searchParams.get("fromPage"));
  const toPage = resolveToPage(request.nextUrl.searchParams.get("toPage"), fromPage);
  const slug = resolveCursorSlug(request.nextUrl.searchParams.get("slug"), target);
  const storedState = await readCursorState(slug);
  const cursorState = normalizeCursorState(storedState, target, fromPage, toPage);
  const processedTarget = cursorState.currentTarget;
  const processedPage = cursorState.currentPage;
  const pageSummary = await syncMovieFeed(processedTarget, { page: processedPage });
  const nextState = buildNextCursorState(cursorState);
  const wrapped =
    nextState.currentTarget === resolveTargetSequence(target)[0] &&
    nextState.currentPage === fromPage &&
    (processedTarget !== nextState.currentTarget || processedPage !== nextState.currentPage);

  await writeCursorState(slug, nextState);
  revalidateCatalogPages();

  return NextResponse.json({
    ok: pageSummary.errors.length === 0,
    mode: "cursor",
    processed: {
      page: processedPage,
      target: processedTarget,
    },
    next: {
      page: nextState.currentPage,
      target: nextState.currentTarget,
    },
    range: {
      fromPage,
      toPage,
    },
    slug,
    summary: pageSummary,
    target,
    wrapped,
  });
}

async function handleRangeMode(request: NextRequest) {
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

  revalidateCatalogPages();

  return NextResponse.json({
    ok: summary.totalErrors === 0,
    mode: "range",
    summary,
    target,
  });
}

export async function GET(request: NextRequest) {
  const authorizationError = getCronAuthorizationError(request);

  if (authorizationError) {
    return authorizationError;
  }

  try {
    const mode = resolveMode(request.nextUrl.searchParams.get("mode"));

    if (mode === "range") {
      return await handleRangeMode(request);
    }

    return await handleCursorMode(request);
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
