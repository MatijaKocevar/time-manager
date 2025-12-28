import { PrismaClient } from "../prisma/generated/client"

const prisma = new PrismaClient()

async function applyMigration() {
    try {
        console.log("Applying notification system migration...")

        await prisma.$executeRawUnsafe(`
            DO $$ BEGIN
                CREATE TYPE "NotificationType" AS ENUM ('REQUEST_SUBMITTED', 'REQUEST_APPROVED', 'REQUEST_REJECTED', 'REQUEST_CANCELLED');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `)

        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "NotificationPreference" (
                "id" TEXT NOT NULL,
                "userId" TEXT NOT NULL,
                "emailNewRequest" BOOLEAN NOT NULL DEFAULT true,
                "emailRequestApproved" BOOLEAN NOT NULL DEFAULT true,
                "emailRequestRejected" BOOLEAN NOT NULL DEFAULT true,
                "emailRequestCancelled" BOOLEAN NOT NULL DEFAULT true,
                "pushNewRequest" BOOLEAN NOT NULL DEFAULT true,
                "pushRequestApproved" BOOLEAN NOT NULL DEFAULT true,
                "pushRequestRejected" BOOLEAN NOT NULL DEFAULT true,
                "pushRequestCancelled" BOOLEAN NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL,

                CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
            );
        `)

        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "Notification" (
                "id" TEXT NOT NULL,
                "userId" TEXT NOT NULL,
                "type" "NotificationType" NOT NULL,
                "title" TEXT NOT NULL,
                "message" TEXT NOT NULL,
                "read" BOOLEAN NOT NULL DEFAULT false,
                "url" TEXT,
                "metadata" JSONB,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP(3) NOT NULL,

                CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
            );
        `)

        await prisma.$executeRawUnsafe(`
            CREATE UNIQUE INDEX IF NOT EXISTS "NotificationPreference_userId_key" ON "NotificationPreference"("userId");
        `)

        await prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS "NotificationPreference_userId_idx" ON "NotificationPreference"("userId");
        `)

        await prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");
        `)

        await prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS "Notification_userId_read_idx" ON "Notification"("userId", "read");
        `)

        await prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "Notification"("createdAt");
        `)

        await prisma.$executeRawUnsafe(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'NotificationPreference_userId_fkey'
                ) THEN
                    ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
                END IF;
            END $$;
        `)

        await prisma.$executeRawUnsafe(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'Notification_userId_fkey'
                ) THEN
                    ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
                END IF;
            END $$;
        `)

        console.log("Migration applied successfully!")
    } catch (error) {
        console.error("Migration failed:", error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

applyMigration()
