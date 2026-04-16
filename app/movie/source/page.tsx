import { redirect } from "next/navigation";

import { fetchDetail } from "@/lib/movie-api";
import { formatMovieTitle } from "@/lib/movie-title";
import { prisma } from "@/lib/prisma";
import { isBlockedMovieCandidate } from "@/lib/movie-visibility";

export const dynamic = "force-dynamic";

type MovieSourcePageProps = {
  searchParams: Promise<{
    sourceUrl?: string;
  }>;
};

function normalizeList(value: string[] | undefined) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

export default async function MovieSourcePage({
  searchParams,
}: MovieSourcePageProps) {
  const params = await searchParams;
  const sourceUrl = params.sourceUrl?.trim();

  if (!sourceUrl) {
    redirect("/search");
  }

  const existing = await prisma.movie.findUnique({
    where: { sourceUrl },
    select: {
      description: true,
      id: true,
      sourceUrl: true,
      thumbnail: true,
      title: true,
    },
  });

  if (existing) {
    if (isBlockedMovieCandidate(existing)) {
      redirect("/search?blocked=1");
    }

    redirect(`/movie/${existing.id}`);
  }

  const detail = await fetchDetail(sourceUrl, { revalidate: 1800 }).catch(
    () => null,
  );

  if (
    detail &&
    isBlockedMovieCandidate({
      description: detail.synopsis,
      sourceUrl: detail.sourceUrl,
      thumbnail: detail.poster,
      title: detail.title,
    })
  ) {
    redirect("/search?blocked=1");
  }

  const movie = await prisma.movie.upsert({
    where: { sourceUrl },
    create: {
      sourceUrl,
      title: formatMovieTitle(detail?.title, {
        sourceUrl,
        year: detail?.releaseDate,
      }),
      thumbnail: detail?.poster ?? null,
      description: detail?.synopsis ?? null,
      genre: detail?.genres?.length ? detail.genres.join(", ") : null,
      releaseDate: detail?.releaseDate ?? null,
      actors: normalizeList(detail?.actors),
      directors: normalizeList(detail?.directors),
      streams: detail?.streams ?? null,
      detailSyncedAt: detail ? new Date() : null,
    },
    update: {
      title: formatMovieTitle(detail?.title, {
        sourceUrl,
        year: detail?.releaseDate,
      }),
      thumbnail: detail?.poster ?? null,
      description: detail?.synopsis ?? null,
      genre: detail?.genres?.length ? detail.genres.join(", ") : null,
      releaseDate: detail?.releaseDate ?? null,
      actors: normalizeList(detail?.actors),
      directors: normalizeList(detail?.directors),
      streams: detail?.streams ?? null,
      detailSyncedAt: detail ? new Date() : null,
    },
    select: {
      id: true,
    },
  });

  redirect(`/movie/${movie.id}`);
}
