CREATE TABLE IF NOT EXISTS "TelegramBotSettings" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL DEFAULT 'default',
  "welcomeMessage" TEXT NOT NULL,
  "openAppLabel" TEXT NOT NULL,
  "openAppUrl" TEXT NOT NULL,
  "searchLabel" TEXT NOT NULL,
  "searchUrl" TEXT NOT NULL,
  "affiliateLabel" TEXT NOT NULL,
  "affiliateUrl" TEXT NOT NULL,
  "affiliateGroupLabel" TEXT NOT NULL,
  "affiliateGroupUrl" TEXT NOT NULL,
  "channelLabel" TEXT NOT NULL,
  "channelUrl" TEXT NOT NULL,
  "supportLabel" TEXT NOT NULL,
  "supportUrl" TEXT NOT NULL,
  "vipLabel" TEXT NOT NULL,
  "vipUrl" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TelegramBotSettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "TelegramBotSettings_slug_key"
ON "TelegramBotSettings"("slug");
