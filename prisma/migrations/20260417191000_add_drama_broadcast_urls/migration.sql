ALTER TABLE "TelegramBotSettings"
ADD COLUMN "dramaAppUrl" TEXT NOT NULL DEFAULT '';

ALTER TABLE "PartnerBot"
ADD COLUMN "dramaBotUrl" TEXT;
