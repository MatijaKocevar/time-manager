-- Add composite indexes for Task table if they don't exist

CREATE INDEX CONCURRENTLY IF NOT EXISTS "Task_userId_status_listId_idx" ON "Task" ("userId", "status", "listId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "Task_userId_listId_status_idx" ON "Task" ("userId", "listId", "status");