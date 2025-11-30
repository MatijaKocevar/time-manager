-- CreateTable
CREATE TABLE "DailyHourSummary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "type" TEXT NOT NULL,
    "manualHours" REAL NOT NULL DEFAULT 0,
    "trackedHours" REAL NOT NULL DEFAULT 0,
    "totalHours" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DailyHourSummary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "DailyHourSummary_userId_idx" ON "DailyHourSummary"("userId");

-- CreateIndex
CREATE INDEX "DailyHourSummary_date_idx" ON "DailyHourSummary"("date");

-- CreateIndex
CREATE INDEX "DailyHourSummary_userId_date_idx" ON "DailyHourSummary"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyHourSummary_userId_date_type_key" ON "DailyHourSummary"("userId", "date", "type");
