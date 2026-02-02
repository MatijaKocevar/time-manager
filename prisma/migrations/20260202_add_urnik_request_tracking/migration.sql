-- CreateEnum
CREATE TYPE "UrnikRequestStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'FAILED');

-- AlterTable
ALTER TABLE "User"
ADD COLUMN "lastUrnikTestAt" TIMESTAMP(3),
ADD COLUMN "urnikPassword" TEXT,
ADD COLUMN "urnikUsername" TEXT;

-- CreateTable
CREATE TABLE "UrnikRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "type" "HourType" NOT NULL,
    "urnikType" INTEGER NOT NULL,
    "status" "UrnikRequestStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "urnikRequestNo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UrnikRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UrnikRequest_userId_idx" ON "UrnikRequest" ("userId");

-- CreateIndex
CREATE INDEX "UrnikRequest_status_idx" ON "UrnikRequest" ("status");

-- CreateIndex
CREATE INDEX "UrnikRequest_date_idx" ON "UrnikRequest" ("date");

-- AddForeignKey
ALTER TABLE "UrnikRequest"
ADD CONSTRAINT "UrnikRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;