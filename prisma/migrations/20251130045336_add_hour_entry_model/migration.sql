-- CreateTable
CREATE TABLE "HourEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "hours" REAL NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'WORK',
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HourEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "HourEntry_userId_idx" ON "HourEntry"("userId");

-- CreateIndex
CREATE INDEX "HourEntry_date_idx" ON "HourEntry"("date");

-- CreateIndex
CREATE UNIQUE INDEX "HourEntry_userId_date_type_key" ON "HourEntry"("userId", "date", "type");
