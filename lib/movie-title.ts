const SEO_WORDS = [
  "box office",
  "download",
  "film",
  "lk21",
  "layarkaca21",
  "layar kaca 21",
  "nonton",
  "rebahin",
  "streaming",
  "sub indo",
  "subtitle indonesia",
  "subtitle indo",
  "subtitel indonesia",
  "subtitel indo",
];

type FormatMovieTitleOptions = {
  sourceUrl?: string | null;
  year?: string | null;
};

function titleFromSourceUrl(sourceUrl: string | null | undefined) {
  if (!sourceUrl) {
    return null;
  }

  try {
    const pathname = new URL(sourceUrl).pathname;
    const slug = pathname.split("/").filter(Boolean).pop();

    return slug?.replace(/[-_]+/g, " ") ?? null;
  } catch {
    const slug = sourceUrl.split("/").filter(Boolean).pop();

    return slug?.replace(/[-_]+/g, " ") ?? null;
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripSeoWords(value: string) {
  return SEO_WORDS.reduce((title, word) => {
    const escaped = escapeRegExp(word).replace(/\\ /g, "\\s+");

    return title.replace(new RegExp(`(^|\\s)${escaped}(?=\\s|$)`, "gi"), " ");
  }, value);
}

function normalizeSeparators(value: string) {
  return value
    .replace(/[|•]+/g, " ")
    .replace(/\([^)]*(sub indo|subtitle|lk21|layarkaca|download)[^)]*\)/gi, " ")
    .replace(/\[[^\]]*(sub indo|subtitle|lk21|layarkaca|download)[^\]]*\]/gi, " ")
    .replace(/\(\s*\)/g, " ")
    .replace(/\[\s*\]/g, " ")
    .replace(/\bdi\s*$/i, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripYear(value: string, year?: string | null) {
  const knownYear = year?.match(/\b(19|20)\d{2}\b/)?.[0];
  const withoutKnownYear = knownYear
    ? value.replace(new RegExp(`\\b${knownYear}\\b`, "g"), " ")
    : value;

  return withoutKnownYear.replace(/\b(19|20)\d{2}\b(?=\s*$)/g, " ");
}

function hasUsefulCapitalization(value: string) {
  return /[A-Z]/.test(value.slice(1)) && /[a-z]/.test(value);
}

function toDisplayTitle(value: string) {
  if (hasUsefulCapitalization(value)) {
    return value;
  }

  const lowerWords = new Set(["a", "an", "and", "at", "by", "for", "in", "of", "on", "or", "the", "to"]);

  return value
    .toLowerCase()
    .split(" ")
    .map((word, index) => {
      if (!word) {
        return word;
      }

      if (index > 0 && lowerWords.has(word)) {
        return word;
      }

      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

export function formatMovieTitle(
  rawTitle: string | null | undefined,
  options: FormatMovieTitleOptions = {},
) {
  const fallbackTitle = titleFromSourceUrl(options.sourceUrl);
  const title = normalizeSeparators(rawTitle ?? "") || fallbackTitle;

  if (!title) {
    return "Film pilihan";
  }

  const cleaned = normalizeSeparators(
    stripYear(stripSeoWords(title), options.year),
  );

  return toDisplayTitle(cleaned || title);
}

export function needsMovieTitleFormatting(
  rawTitle: string,
  options: FormatMovieTitleOptions = {},
) {
  return formatMovieTitle(rawTitle, options) !== rawTitle;
}
