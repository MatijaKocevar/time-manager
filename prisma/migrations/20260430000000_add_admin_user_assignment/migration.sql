-- AlterTable
ALTER TABLE "User"
ADD COLUMN "autoAdmin" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "AdminUserAssignment" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminUserAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUserAssignment_adminId_userId_key" ON "AdminUserAssignment" ("adminId", "userId");

-- CreateIndex
CREATE INDEX "AdminUserAssignment_adminId_idx" ON "AdminUserAssignment" ("adminId");

-- CreateIndex
CREATE INDEX "AdminUserAssignment_userId_idx" ON "AdminUserAssignment" ("userId");

-- AddForeignKey
ALTER TABLE "AdminUserAssignment"
ADD CONSTRAINT "AdminUserAssignment_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminUserAssignment"
ADD CONSTRAINT "AdminUserAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;