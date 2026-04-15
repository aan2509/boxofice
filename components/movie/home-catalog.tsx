"use client";

import * as React from "react";

import { MovieCardLink } from "@/components/movie/movie-card-link";
import { Skeleton } from "@/components/ui/skeleton";
import type { HomepageFilters, MovieCard } from "@/lib/movie-feeds";

type HomeCatalogProps = {
  filters: HomepageFilters;
  initialMovies: MovieCard[];
  initialNextOffset: number | null;
  totalMovies: number;
};

type CatalogPayload = {
  items?: MovieCard[];
  nextOffset?: number | null;
  totalMovies?: number;
};

const PAGE_SIZE = 18;

function buildCatalogUrl(filters: HomepageFilters, offset: number) {
  const params = new URLSearchParams({
    limit: String(PAGE_SIZE),
    offset: String(offset),
  });

  if (filters.genre?.trim()) {
    params.set("genre", filters.genre.trim());
  }

  if (filters.year?.trim()) {
    params.set("year", filters.year.trim());
  }

  return `/api/catalog?${params.toString()}`;
}

export function HomeCatalog({
  filters,
  initialMovies,
  initialNextOffset,
  totalMovies,
}: HomeCatalogProps) {
  const [movies, setMovies] = React.useState(initialMovies);
  const [nextOffset, setNextOffset] = React.useState<number | null>(
    initialNextOffset,
  );
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  const loadMore = React.useCallback(async () => {
    if (isLoadingMore || nextOffset === null) {
      return;
    }

    setIsLoadingMore(true);
    setLoadError(null);

    try {
      const response = await fetch(buildCatalogUrl(filters, nextOffset), {
        credentials: "same-origin",
      });
      const payload = (await response.json().catch(() => null)) as
        | CatalogPayload
        | null;

      if (!response.ok) {
        throw new Error(
          payload && "error" in payload && typeof payload.error === "string"
            ? payload.error
            : "Gagal memuat katalog berikutnya.",
        );
      }

      const incomingMovies = payload?.items ?? [];

      setMovies((current) => {
        const seen = new Set(current.map((movie) => movie.id));
        const merged = [...current];

        for (const movie of incomingMovies) {
          if (!seen.has(movie.id)) {
            merged.push(movie);
            seen.add(movie.id);
          }
        }

        return merged;
      });
      setNextOffset(payload?.nextOffset ?? null);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Gagal memuat katalog berikutnya.",
      );
    } finally {
      setIsLoadingMore(false);
    }
  }, [filters, isLoadingMore, nextOffset]);

  React.useEffect(() => {
    setMovies(initialMovies);
    setNextOffset(initialNextOffset);
    setLoadError(null);
    setIsLoadingMore(false);
  }, [initialMovies, initialNextOffset]);

  React.useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel || nextOffset === null) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (entry?.isIntersecting) {
          void loadMore();
        }
      },
      {
        rootMargin: "480px 0px",
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [loadMore, nextOffset]);

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-28 pt-4 sm:px-8 sm:pb-10 sm:pt-6 lg:px-10">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-500">
            Katalog
          </p>
          <h2 className="mt-1 text-2xl font-black text-white sm:text-3xl">
            Semua film
          </h2>
        </div>
        <p className="text-xs text-neutral-400 sm:text-sm">
          {totalMovies} judul
        </p>
      </div>

      {movies.length ? (
        <div className="grid grid-cols-3 gap-x-3 gap-y-1.5 sm:grid-cols-4 sm:gap-x-4 sm:gap-y-4 lg:grid-cols-6">
          {movies.map((movie) => (
            <MovieCardLink key={movie.id} movie={movie} />
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-white/15 bg-neutral-900/60 px-5 py-12 text-center">
          <p className="text-xl font-semibold text-white">
            Belum ada film yang cocok
          </p>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            Coba ganti filter genre atau tahun supaya katalog kembali terisi.
          </p>
        </div>
      )}

      {isLoadingMore ? (
        <div className="mt-5 grid grid-cols-3 gap-x-3 gap-y-2 sm:grid-cols-4 sm:gap-x-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index}>
              <Skeleton className="aspect-[2/3] w-full bg-white/10" />
              <Skeleton className="mt-3 h-4 w-11/12 bg-white/10" />
              <Skeleton className="mt-2 h-3 w-7/12 bg-white/10" />
            </div>
          ))}
        </div>
      ) : null}

      {loadError ? (
        <div className="mt-5 rounded-md border border-red-400/15 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {loadError}
          <button
            type="button"
            onClick={() => void loadMore()}
            className="ml-2 font-semibold text-white underline underline-offset-4"
          >
            Coba lagi
          </button>
        </div>
      ) : null}

      {nextOffset !== null ? (
        <div ref={sentinelRef} className="h-10 w-full" aria-hidden="true" />
      ) : movies.length ? (
        <p className="mt-6 text-center text-xs text-neutral-500">
          Semua judul yang cocok sudah tampil.
        </p>
      ) : null}
    </section>
  );
}
