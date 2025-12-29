-- AlterTable
ALTER TABLE "Request"
ADD COLUMN "skipHolidays" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "Request"
ADD COLUMN "skipWeekends" BOOLEAN NOT NULL DEFAULT true;