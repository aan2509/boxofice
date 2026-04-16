import type { Prisma } from "@/app/generated/prisma/client";

const BLOCKED_MOVIE_TEXT_MARKERS = [
  "anda akan dialihkan",
  "akan dialihkan ke",
  "nontondrama",
  "halaman tidak berganti",
  "klik tombol di bawah",
];

const BLOCKED_MOVIE_URL_MARKERS = ["nontondrama"];

type MovieVisibilityCandidate = {
  description?: string | null;
  sourceUrl?: string | null;
  thumbnail?: string | null;
  title?: string | null;
};

function normalizeSearchableText(value: string | null | undefined) {
  return value?.toLowerCase().replace(/\s+/g, " ").trim() ?? "";
}

function containsAnyMarker(value: string | null | undefined, markers: string[]) {
  const normalized = normalizeSearchableText(value);

  if (!normalized) {
    return false;
  }

  return markers.some((marker) => normalized.includes(marker));
}

export function isBlockedMovieCandidate(candidate: MovieVisibilityCandidate) {
  return (
    containsAnyMarker(candidate.title, BLOCKED_MOVIE_TEXT_MARKERS) ||
    containsAnyMarker(candidate.description, BLOCKED_MOVIE_TEXT_MARKERS) ||
    containsAnyMarker(candidate.sourceUrl, BLOCKED_MOVIE_URL_MARKERS) ||
    containsAnyMarker(candidate.thumbnail, BLOCKED_MOVIE_URL_MARKERS)
  );
}

export function getBlockedMovieWhereInput(): Prisma.MovieWhereInput {
  return {
    OR: [
      ...BLOCKED_MOVIE_TEXT_MARKERS.flatMap((marker) => [
        {
          title: {
            contains: marker,
            mode: "insensitive" as const,
          },
        },
        {
          description: {
            contains: marker,
            mode: "insensitive" as const,
          },
        },
      ]),
      ...BLOCKED_MOVIE_URL_MARKERS.flatMap((marker) => [
        {
          sourceUrl: {
            contains: marker,
            mode: "insensitive" as const,
          },
        },
        {
          thumbnail: {
            contains: marker,
            mode: "insensitive" as const,
          },
        },
      ]),
    ],
  };
}

export function excludeBlockedMoviesWhere(
  where: Prisma.MovieWhereInput = {},
): Prisma.MovieWhereInput {
  return {
    AND: [where, { NOT: getBlockedMovieWhereInput() }],
  };
}
