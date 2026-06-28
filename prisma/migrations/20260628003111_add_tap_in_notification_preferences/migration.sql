-- AlterTable
ALTER TABLE "NotificationPreference" ADD COLUMN     "emailTapIn" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "emailTapOut" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "pushTapIn" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "pushTapOut" BOOLEAN NOT NULL DEFAULT true;
