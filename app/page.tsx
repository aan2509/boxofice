import Image from "next/image";
import Link from "next/link";

import { HomeCatalog } from "@/components/movie/home-catalog";
import { TelegramEntryGate } from "@/components/telegram/telegram-entry-gate";
import { resolveChannelBroadcastStartParam } from "@/lib/channel-broadcasts";
import { extractChannelBroadcastTokenFromStartParam } from "@/lib/channel-broadcast-tokens";
import {
  getCatalogPage,
  getHomepageFilterOptions,
  type HomepageFilters,
} from "@/lib/movie-feeds";
import { getTelegramBotSettingsSafe } from "@/lib/telegram-bot-settings";
import {
  buildTelegramBotChatUrlForUsername,
  buildTelegramMainMiniAppUrlForUsername,
  extractSearchRouteFromStartParam,
} from "@/lib/telegram-miniapp";
import { getCurrentUserSession } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams: Promise<{
    genre?: string;
    ref?: string;
    start_param?: string;
    startapp?: string;
    tgWebAppStartParam?: string;
    year?: string;
  }>;
};

function normalizeQueryValue(value?: string | null) {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function buildFilterHref(
  current: HomepageFilters,
  patch: Partial<Record<keyof HomepageFilters, string | null>>,
) {
  const nextGenre = Object.prototype.hasOwnProperty.call(patch, "genre")
    ? patch.genre
    : current.genre;
  const nextYear = Object.prototype.hasOwnProperty.call(patch, "year")
    ? patch.year
    : current.year;
  const next = {
    genre: normalizeQueryValue(nextGenre),
    year: normalizeQueryValue(nextYear),
  };
  const params = new URLSearchParams();

  if (next.genre) {
    params.set("genre", next.genre);
  }

  if (next.year) {
    params.set("year", next.year);
  }

  const query = params.toString();

  return query ? `/?${query}` : "/";
}

function FilterChip({
  active,
  href,
  label,
}: {
  active: boolean;
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      prefetch
      scroll={false}
      data-haptic="light"
      className={[
        "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-red-400/40 bg-red-600 text-white"
          : "border-white/10 bg-white/[0.04] text-neutral-300 hover:bg-white/[0.08]",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

export default async function Home({ searchParams }: HomePageProps) {
  const [params, user] = await Promise.all([
    searchParams,
    getCurrentUserSession(),
  ]);
  const { genre, year } = params;

  if (!user) {
    const telegram = await getTelegramBotSettingsSafe();

    return (
      <TelegramEntryGate
        adminLoginUrl="/admin/login"
        botChatUrl={buildTelegramBotChatUrlForUsername(
          telegram.runtime.botUsername,
        )}
        miniAppUrl={buildTelegramMainMiniAppUrlForUsername(
          telegram.runtime.botUsername,
        )}
      />
    );
  }

  const selectedGenre = normalizeQueryValue(genre);
  const selectedYear = normalizeQueryValue(year);
  const incomingStartParam =
    normalizeQueryValue(params.start_param) ??
    normalizeQueryValue(params.startapp) ??
    normalizeQueryValue(params.tgWebAppStartParam) ??
    normalizeQueryValue(params.ref);
  const isBroadcastStart = Boolean(
    extractChannelBroadcastTokenFromStartParam(incomingStartParam),
  );
  const isSearchStart = extractSearchRouteFromStartParam(incomingStartParam);

  if (isBroadcastStart) {
    const broadcastTarget = await resolveChannelBroadcastStartParam(
      incomingStartParam,
    ).catch(() => null);

    return (
      <main className="relative min-h-screen overflow-hidden bg-black px-4 py-8 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(220,38,38,0.2),transparent_26%),radial-gradient(circle_at_50%_18%,rgba(255,115,0,0.14),transparent_32%),linear-gradient(180deg,#120909_0%,#050505_58%,#020202_100%)]" />

        <section className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center">
          <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,20,20,0.92),rgba(8,8,8,0.96))] p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.48)] backdrop-blur-xl">
            {broadcastTarget?.movie?.thumbnail ? (
              <div className="mx-auto mb-5 overflow-hidden rounded-[18px] border border-white/10 bg-white/5 shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
                <div className="relative mx-auto aspect-[4/5] w-24">
                  <Image
                    src={broadcastTarget.movie.thumbnail}
                    alt={broadcastTarget.movie.title || "Poster film"}
                    fill
                    unoptimized
                    sizes="96px"
                    className="object-cover"
                  />
                </div>
              </div>
            ) : null}
            <div className="mx-auto size-11 animate-spin rounded-full border-2 border-red-400/25 border-t-red-400" />
            <p className="mt-5 text-lg font-semibold text-white">
              Membuka film dari channel...
            </p>
            {broadcastTarget?.movie?.title ? (
              <p className="mt-2 text-sm font-medium text-orange-200">
                {broadcastTarget.movie.title}
              </p>
            ) : null}
            <p className="mt-3 text-sm leading-7 text-neutral-400">
              Kami sedang menyiapkan halaman tujuan kamu di Mini App. Tunggu
              sebentar ya.
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (isSearchStart) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-black px-4 py-8 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(220,38,38,0.2),transparent_26%),radial-gradient(circle_at_50%_18%,rgba(255,115,0,0.14),transparent_32%),linear-gradient(180deg,#120909_0%,#050505_58%,#020202_100%)]" />

        <section className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center">
          <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,20,20,0.92),rgba(8,8,8,0.96))] p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.48)] backdrop-blur-xl">
            <div className="mx-auto size-11 animate-spin rounded-full border-2 border-red-400/25 border-t-red-400" />
            <p className="mt-5 text-lg font-semibold text-white">
              Membuka pencarian film...
            </p>
            <p className="mt-3 text-sm leading-7 text-neutral-400">
              Kami sedang menyiapkan halaman cari judul di Mini App. Tunggu
              sebentar ya.
            </p>
          </div>
        </section>
      </main>
    );
  }

  const [filters, catalog] = await Promise.all([
    getHomepageFilterOptions(),
    getCatalogPage({
      genre: selectedGenre,
      limit: 18,
      offset: 0,
      year: selectedYear,
    }),
  ]);
  const currentFilters = {
    genre: selectedGenre,
    year: selectedYear,
  } satisfies HomepageFilters;
  const displayName =
    user.telegramFirstName?.trim() ||
    user.name.trim() ||
    user.telegramUsername ||
    "Teman";
  const usernameLabel = user.telegramUsername
    ? `@${user.telegramUsername}`
    : "Akun Telegram aktif";

  return (
    <main className="min-h-screen bg-black pb-24 text-white sm:pb-8">
      <header className="fixed inset-x-0 top-0 z-30 border-b border-white/10 bg-[linear-gradient(180deg,rgba(10,10,10,0.96),rgba(10,10,10,0.88))] backdrop-blur-xl">
        <div className="mx-auto w-full max-w-7xl px-4 pb-2 pt-[calc(env(safe-area-inset-top)+8px)] sm:px-8 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="relative size-11 shrink-0 overflow-hidden rounded-full bg-white/10 ring-1 ring-white/10">
              {user.telegramPhotoUrl ? (
                <Image
                  src={user.telegramPhotoUrl}
                  alt={displayName}
                  fill
                  unoptimized
                  sizes="44px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-white">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-white">
                {displayName}
              </p>
              <p className="truncate text-xs text-neutral-400">
                {usernameLabel}
              </p>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            <div>
              <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-500">
                Kategori
              </div>
              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
                <FilterChip
                  active={!selectedGenre}
                  href={buildFilterHref(currentFilters, { genre: null })}
                  label="Semua"
                />
                {filters.genres.map((genreOption) => (
                  <FilterChip
                    key={genreOption}
                    active={selectedGenre === genreOption}
                    href={buildFilterHref(currentFilters, {
                      genre: genreOption,
                    })}
                    label={genreOption}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="pt-[118px] sm:pt-[126px]">
        <HomeCatalog
          filters={currentFilters}
          initialMovies={catalog.items}
          initialNextOffset={catalog.nextOffset}
        />
      </div>
    </main>
  );
}
