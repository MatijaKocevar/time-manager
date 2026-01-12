-- AlterTable
ALTER TABLE "User" ADD COLUMN     "trackerSelectedTaskId" TEXT,
ADD COLUMN     "trackerSelectedType" "HourType" NOT NULL DEFAULT 'WORK';
