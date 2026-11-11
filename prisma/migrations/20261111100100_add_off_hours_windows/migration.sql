-- AlterTable
ALTER TABLE "ApiToken" ADD COLUMN "defaultHourType" "HourType";

-- AlterTable
ALTER TABLE "HourEntry" ADD COLUMN "offHoursWindowId" TEXT;

-- AlterTable
ALTER TABLE "TaskTimeEntry" ADD COLUMN "offHoursWindowId" TEXT;

-- CreateTable
CREATE TABLE "OffHoursWindow" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startDateTime" TIMESTAMP(3) NOT NULL,
    "endDateTime" TIMESTAMP(3) NOT NULL,
    "type" "HourType" NOT NULL DEFAULT 'OFF_HOURS',
    "appliesToFuture" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OffHoursWindow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OffHoursWindow_userId_date_idx" ON "OffHoursWindow"("userId", "date");

-- CreateIndex
CREATE INDEX "OffHoursWindow_userId_startDateTime_idx" ON "OffHoursWindow"("userId", "startDateTime");

-- CreateIndex
CREATE INDEX "TaskTimeEntry_offHoursWindowId_idx" ON "TaskTimeEntry"("offHoursWindowId");

-- CreateIndex
CREATE INDEX "HourEntry_offHoursWindowId_idx" ON "HourEntry"("offHoursWindowId");

-- AddForeignKey
ALTER TABLE "TaskTimeEntry" ADD CONSTRAINT "TaskTimeEntry_offHoursWindowId_fkey" FOREIGN KEY ("offHoursWindowId") REFERENCES "OffHoursWindow"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HourEntry" ADD CONSTRAINT "HourEntry_offHoursWindowId_fkey" FOREIGN KEY ("offHoursWindowId") REFERENCES "OffHoursWindow"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OffHoursWindow" ADD CONSTRAINT "OffHoursWindow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
