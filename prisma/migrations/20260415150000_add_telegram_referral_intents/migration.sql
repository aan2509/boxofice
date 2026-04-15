CREATE TABLE IF NOT EXISTS "TelegramReferralIntent" (
  "id" TEXT NOT NULL,
  "telegramId" TEXT NOT NULL,
  "referralCode" TEXT NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TelegramReferralIntent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "TelegramReferralIntent_telegramId_key"
  ON "TelegramReferralIntent"("telegramId");

CREATE INDEX IF NOT EXISTS "TelegramReferralIntent_referralCode_idx"
  ON "TelegramReferralIntent"("referralCode");

CREATE INDEX IF NOT EXISTS "TelegramReferralIntent_createdAt_idx"
  ON "TelegramReferralIntent"("createdAt");
