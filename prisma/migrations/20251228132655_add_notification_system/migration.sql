-- CreateEnum (if not exists)
DO $$ BEGIN
    CREATE TYPE "NotificationType" AS ENUM ('REQUEST_SUBMITTED', 'REQUEST_APPROVED', 'REQUEST_REJECTED', 'REQUEST_CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailNewRequest" BOOLEAN NOT NULL DEFAULT true,
    "emailRequestApproved" BOOLEAN NOT NULL DEFAULT true,
    "emailRequestRejected" BOOLEAN NOT NULL DEFAULT true,
    "emailRequestCancelled" BOOLEAN NOT NULL DEFAULT true,
    "pushNewRequest" BOOLEAN NOT NULL DEFAULT true,
    "pushRequestApproved" BOOLEAN NOT NULL DEFAULT true,
    "pushRequestRejected" BOOLEAN NOT NULL DEFAULT true,
    "pushRequestCancelled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "url" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference" ("userId");

-- CreateIndex
CREATE INDEX "NotificationPreference_userId_idx" ON "NotificationPreference" ("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification" ("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification" ("userId", "read");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification" ("createdAt");

-- AddForeignKey
ALTER TABLE "NotificationPreference"
ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification"
ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;