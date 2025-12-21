-- AlterTable
ALTER TABLE "User" ADD COLUMN     "sidebarExpandedItems" JSONB DEFAULT '[]',
ADD COLUMN     "theme" TEXT NOT NULL DEFAULT 'light';
