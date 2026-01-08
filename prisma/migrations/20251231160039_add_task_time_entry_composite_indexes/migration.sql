-- Note: daily_hour_summary already exists as a materialized view from migration 20251227043229
-- Indexes on materialized views are created here if they don't exist

-- CreateIndex (if not exists)
CREATE INDEX IF NOT EXISTS "daily_hour_summary_userId_idx" ON "daily_hour_summary"("userId");

-- CreateIndex (if not exists)
CREATE INDEX IF NOT EXISTS "daily_hour_summary_date_idx" ON "daily_hour_summary"("date");

-- CreateIndex (if not exists)
CREATE INDEX IF NOT EXISTS "daily_hour_summary_userId_date_idx" ON "daily_hour_summary"("userId", "date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Task_userId_status_listId_idx" ON "Task"("userId", "status", "listId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Task_userId_listId_status_idx" ON "Task"("userId", "listId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TaskTimeEntry_userId_startTime_idx" ON "TaskTimeEntry"("userId", "startTime");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TaskTimeEntry_userId_endTime_idx" ON "TaskTimeEntry"("userId", "endTime");
