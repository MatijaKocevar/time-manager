-- DropIndex
DROP INDEX "Shift_userId_date_key";

-- AlterTable
ALTER TABLE "Request"
ADD COLUMN "endTime" TEXT,
ADD COLUMN "isFullDay" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "originalEndDate" TIMESTAMP(3),
ADD COLUMN "originalStartDate" TIMESTAMP(3),
ADD COLUMN "requestedHours" DECIMAL(65, 30),
ADD COLUMN "splitFrom" TEXT,
ADD COLUMN "startTime" TEXT,
ADD COLUMN "supersededBy" TEXT,
ADD COLUMN "trimmedBy" TEXT;

-- AlterTable
ALTER TABLE "Shift"
ADD COLUMN "endDateTime" TIMESTAMP(3),
ADD COLUMN "startDateTime" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Request_userId_createdAt_idx" ON "Request" ("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Shift_userId_date_idx" ON "Shift" ("userId", "date");

-- CreateIndex
CREATE INDEX "Shift_userId_startDateTime_idx" ON "Shift" ("userId", "startDateTime");

-- CreateIndex
CREATE INDEX "Task_id_title_status_listId_idx" ON "Task" (
    "id",
    "title",
    "status",
    "listId"
);

-- AddForeignKey
ALTER TABLE "Request"
ADD CONSTRAINT "Request_supersededBy_fkey" FOREIGN KEY ("supersededBy") REFERENCES "Request" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request"
ADD CONSTRAINT "Request_trimmedBy_fkey" FOREIGN KEY ("trimmedBy") REFERENCES "Request" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request"
ADD CONSTRAINT "Request_splitFrom_fkey" FOREIGN KEY ("splitFrom") REFERENCES "Request" ("id") ON DELETE SET NULL ON UPDATE CASCADE;