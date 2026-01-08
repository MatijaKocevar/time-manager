-- DropIndex
DROP INDEX IF EXISTS "Shift_userId_date_key";

-- AlterTable
ALTER TABLE "Request"
ADD COLUMN IF NOT EXISTS "endTime" TEXT,
ADD COLUMN IF NOT EXISTS "isFullDay" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "originalEndDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "originalStartDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "requestedHours" DECIMAL(65, 30),
ADD COLUMN IF NOT EXISTS "splitFrom" TEXT,
ADD COLUMN IF NOT EXISTS "startTime" TEXT,
ADD COLUMN IF NOT EXISTS "supersededBy" TEXT,
ADD COLUMN IF NOT EXISTS "trimmedBy" TEXT;

-- AlterTable
ALTER TABLE "Shift"
ADD COLUMN IF NOT EXISTS "endDateTime" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "startDateTime" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Request_userId_createdAt_idx" ON "Request" ("userId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Shift_userId_date_idx" ON "Shift" ("userId", "date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Shift_userId_startDateTime_idx" ON "Shift" ("userId", "startDateTime");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Task_id_title_status_listId_idx" ON "Task" (
    "id",
    "title",
    "status",
    "listId"
);

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Request_supersededBy_fkey'
    ) THEN
        ALTER TABLE "Request"
        ADD CONSTRAINT "Request_supersededBy_fkey" FOREIGN KEY ("supersededBy") REFERENCES "Request" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Request_trimmedBy_fkey'
    ) THEN
        ALTER TABLE "Request"
        ADD CONSTRAINT "Request_trimmedBy_fkey" FOREIGN KEY ("trimmedBy") REFERENCES "Request" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Request_splitFrom_fkey'
    ) THEN
        ALTER TABLE "Request"
        ADD CONSTRAINT "Request_splitFrom_fkey" FOREIGN KEY ("splitFrom") REFERENCES "Request" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;