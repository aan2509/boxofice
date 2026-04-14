import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserSession } from "@/lib/user-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safePositiveInteger(value: unknown) {
  const number = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(number) || number < 0) {
    return 0;
  }

  return Math.trunc(number);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserSession();

  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    completed?: unknown;
    durationSeconds?: unknown;
    movieId?: unknown;
    progressSeconds?: unknown;
  } | null;
  const movieId = typeof body?.movieId === "string" ? body.movieId.trim() : "";

  if (!movieId) {
    return NextResponse.json({ error: "movieId wajib diisi" }, { status: 400 });
  }

  const progressSeconds = safePositiveInteger(body?.progressSeconds);

  if (progressSeconds < 5 && body?.completed !== true) {
    return NextResponse.json({ ok: true, skipped: "progress_too_low" });
  }

  await prisma.watchHistory.upsert({
    where: {
      userId_movieId: {
        movieId,
        userId: user.id,
      },
    },
    create: {
      completed: false,
      durationSeconds: null,
      movieId,
      progressSeconds: 0,
      userId: user.id,
    },
    update: {
      completed: false,
      durationSeconds: null,
      lastWatchedAt: new Date(),
      progressSeconds: 0,
    },
  });

  return NextResponse.json({ ok: true });
}
