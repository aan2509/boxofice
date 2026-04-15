-- CreateTable
CREATE TABLE "PartnerBot" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "label" TEXT,
    "telegramBotId" TEXT NOT NULL,
    "botToken" TEXT NOT NULL,
    "botUsername" TEXT NOT NULL,
    "botName" TEXT NOT NULL,
    "miniAppShortName" TEXT,
    "webhookSecret" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerBot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PartnerBot_telegramBotId_key" ON "PartnerBot"("telegramBotId");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerBot_botUsername_key" ON "PartnerBot"("botUsername");

-- CreateIndex
CREATE INDEX "PartnerBot_ownerUserId_active_idx" ON "PartnerBot"("ownerUserId", "active");

-- CreateIndex
CREATE INDEX "PartnerBot_active_updatedAt_idx" ON "PartnerBot"("active", "updatedAt");

-- AddForeignKey
ALTER TABLE "PartnerBot" ADD CONSTRAINT "PartnerBot_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
