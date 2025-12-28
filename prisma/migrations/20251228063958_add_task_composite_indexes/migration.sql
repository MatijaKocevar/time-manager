-- CreateTable
CREATE TABLE "daily_hour_summary" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "HourType" NOT NULL,
    "manualHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trackedHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_hour_summary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "daily_hour_summary_userId_idx" ON "daily_hour_summary"("userId");

-- CreateIndex
CREATE INDEX "daily_hour_summary_date_idx" ON "daily_hour_summary"("date");

-- CreateIndex
CREATE INDEX "daily_hour_summary_userId_date_idx" ON "daily_hour_summary"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_hour_summary_userId_date_type_key" ON "daily_hour_summary"("userId", "date", "type");

-- CreateIndex
CREATE INDEX "Task_userId_status_listId_idx" ON "Task"("userId", "status", "listId");

-- CreateIndex
CREATE INDEX "Task_userId_listId_status_idx" ON "Task"("userId", "listId", "status");

-- AddForeignKey
ALTER TABLE "daily_hour_summary" ADD CONSTRAINT "daily_hour_summary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
