CREATE TABLE "CronJobCursor" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "state" JSONB NOT NULL,
  "lastRunAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CronJobCursor_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CronJobCursor_slug_key" ON "CronJobCursor"("slug");
