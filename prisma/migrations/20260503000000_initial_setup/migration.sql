-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "HourType" AS ENUM ('WORK', 'VACATION', 'SICK_LEAVE', 'WORK_FROM_HOME', 'BREAK', 'PRIVATE');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE', 'ON_HOLD', 'CANCELED');

-- CreateEnum
CREATE TYPE "RequestType" AS ENUM ('WORK', 'VACATION', 'SICK_LEAVE', 'WORK_FROM_HOME');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ShiftLocation" AS ENUM ('OFFICE', 'HOME', 'VACATION', 'SICK_LEAVE');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('REQUEST_SUBMITTED', 'REQUEST_APPROVED', 'REQUEST_REJECTED', 'REQUEST_CANCELLED', 'AUTO_CHECKIN_REMINDER', 'AUTO_CHECKIN_COMPLETED', 'AUTO_CHECKOUT_REMINDER', 'AUTO_CHECKOUT_COMPLETED');

-- CreateEnum
CREATE TYPE "UrnikRequestStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'FAILED');

-- CreateEnum
CREATE TYPE "UrnikRequestCategory" AS ENUM ('HOUR', 'DAY');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "deactivatedAt" TIMESTAMP(3),
    "anonymizedAt" TIMESTAMP(3),
    "sidebarOpen" BOOLEAN NOT NULL DEFAULT true,
    "sidebarExpandedItems" JSONB DEFAULT '[]',
    "theme" TEXT NOT NULL DEFAULT 'light',
    "locale" TEXT NOT NULL DEFAULT 'en',
    "workStartTime" TEXT DEFAULT '08:00',
    "workEndTime" TEXT DEFAULT '16:00',
    "workHoursPerDay" DOUBLE PRECISION DEFAULT 8.0,
    "trackerSelectedType" "HourType" NOT NULL DEFAULT 'WORK',
    "trackerSelectedTaskId" TEXT,
    "urnikUsername" TEXT,
    "urnikPassword" TEXT,
    "urnikUserId" TEXT,
    "lastUrnikTestAt" TIMESTAMP(3),
    "autoAdmin" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUserAssignment" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminUserAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HourEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "type" "HourType" NOT NULL DEFAULT 'WORK',
    "description" TEXT,
    "taskId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HourEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "parentId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isExpanded" BOOLEAN NOT NULL DEFAULT false,
    "isSystemTask" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "listId" TEXT,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskTimeEntry" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" "HourType" NOT NULL DEFAULT 'WORK',

    CONSTRAINT "TaskTimeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Request" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "RequestType" NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "location" TEXT,
    "affectsHourType" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cancellationReason" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelledBy" TEXT,
    "skipHolidays" BOOLEAN NOT NULL DEFAULT true,
    "skipWeekends" BOOLEAN NOT NULL DEFAULT true,
    "endTime" TEXT,
    "isFullDay" BOOLEAN NOT NULL DEFAULT true,
    "originalEndDate" TIMESTAMP(3),
    "originalStartDate" TIMESTAMP(3),
    "requestedHours" DECIMAL(65,30),
    "splitFrom" TEXT,
    "startTime" TEXT,
    "supersededBy" TEXT,
    "trimmedBy" TEXT,
    "urnikNetSynced" BOOLEAN NOT NULL DEFAULT false,
    "urnikNetStatus" "UrnikRequestStatus",
    "urnikNetSyncedAt" TIMESTAMP(3),
    "urnikNetRequestNo" TEXT,
    "urnikNetError" TEXT,

    CONSTRAINT "Request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "location" "ShiftLocation" NOT NULL DEFAULT 'OFFICE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "endDateTime" TIMESTAMP(3),
    "startDateTime" TIMESTAMP(3),

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "List" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "List_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Holiday" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
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
    "emailAutoCheckin" BOOLEAN NOT NULL DEFAULT true,
    "pushAutoCheckin" BOOLEAN NOT NULL DEFAULT true,
    "emailAutoCheckout" BOOLEAN NOT NULL DEFAULT true,
    "pushAutoCheckout" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
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

-- CreateTable
CREATE TABLE "UserPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hoursViewMode" TEXT NOT NULL DEFAULT 'weekly',
    "hoursCardCollapsed" BOOLEAN NOT NULL DEFAULT false,
    "hoursExpandedRows" JSONB DEFAULT '[]',
    "autoCheckInEnabled" BOOLEAN NOT NULL DEFAULT false,
    "autoCheckOutEnabled" BOOLEAN NOT NULL DEFAULT false,
    "cookieConsent" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TutorialSeen" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pageKey" TEXT NOT NULL,
    "seenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TutorialSeen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutoCheckoutCancellation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutoCheckoutCancellation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserWorkDay" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,

    CONSTRAINT "UserWorkDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkTimeAdjustment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "adjustedStartTime" TEXT,
    "adjustedEndTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkTimeAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutoClockState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clockedInAt" TIMESTAMP(3),
    "clockedOutAt" TIMESTAMP(3),
    "checkinReminderFiredAt" TIMESTAMP(3),
    "checkinFiredAt" TIMESTAMP(3),
    "checkoutReminderFiredAt" TIMESTAMP(3),
    "checkoutFiredAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutoClockState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UrnikRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "UrnikRequestCategory" NOT NULL DEFAULT 'HOUR',
    "date" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "startTime" TEXT,
    "endTime" TEXT,
    "hours" DOUBLE PRECISION,
    "type" "HourType" NOT NULL,
    "urnikType" INTEGER,
    "status" "UrnikRequestStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "urnikRequestNo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UrnikRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "AdminUserAssignment_adminId_idx" ON "AdminUserAssignment"("adminId");

-- CreateIndex
CREATE INDEX "AdminUserAssignment_userId_idx" ON "AdminUserAssignment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUserAssignment_adminId_userId_key" ON "AdminUserAssignment"("adminId", "userId");

-- CreateIndex
CREATE INDEX "HourEntry_userId_idx" ON "HourEntry"("userId");

-- CreateIndex
CREATE INDEX "HourEntry_date_idx" ON "HourEntry"("date");

-- CreateIndex
CREATE INDEX "HourEntry_taskId_idx" ON "HourEntry"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "HourEntry_userId_date_type_taskId_key" ON "HourEntry"("userId", "date", "type", "taskId");

-- CreateIndex
CREATE INDEX "Task_userId_idx" ON "Task"("userId");

-- CreateIndex
CREATE INDEX "Task_listId_idx" ON "Task"("listId");

-- CreateIndex
CREATE INDEX "Task_parentId_idx" ON "Task"("parentId");

-- CreateIndex
CREATE INDEX "Task_userId_status_idx" ON "Task"("userId", "status");

-- CreateIndex
CREATE INDEX "Task_userId_listId_idx" ON "Task"("userId", "listId");

-- CreateIndex
CREATE INDEX "Task_userId_status_listId_idx" ON "Task"("userId", "status", "listId");

-- CreateIndex
CREATE INDEX "Task_userId_listId_status_idx" ON "Task"("userId", "listId", "status");

-- CreateIndex
CREATE INDEX "Task_id_title_status_listId_idx" ON "Task"("id", "title", "status", "listId");

-- CreateIndex
CREATE INDEX "TaskTimeEntry_taskId_idx" ON "TaskTimeEntry"("taskId");

-- CreateIndex
CREATE INDEX "TaskTimeEntry_userId_idx" ON "TaskTimeEntry"("userId");

-- CreateIndex
CREATE INDEX "TaskTimeEntry_startTime_idx" ON "TaskTimeEntry"("startTime");

-- CreateIndex
CREATE INDEX "TaskTimeEntry_userId_startTime_idx" ON "TaskTimeEntry"("userId", "startTime");

-- CreateIndex
CREATE INDEX "TaskTimeEntry_userId_endTime_idx" ON "TaskTimeEntry"("userId", "endTime");

-- CreateIndex
CREATE INDEX "TaskTimeEntry_taskId_startTime_idx" ON "TaskTimeEntry"("taskId", "startTime");

-- CreateIndex
CREATE INDEX "TaskTimeEntry_userId_startTime_type_idx" ON "TaskTimeEntry"("userId", "startTime", "type");

-- CreateIndex
CREATE INDEX "Request_userId_idx" ON "Request"("userId");

-- CreateIndex
CREATE INDEX "Request_status_idx" ON "Request"("status");

-- CreateIndex
CREATE INDEX "Request_startDate_idx" ON "Request"("startDate");

-- CreateIndex
CREATE INDEX "Request_userId_status_idx" ON "Request"("userId", "status");

-- CreateIndex
CREATE INDEX "Request_userId_createdAt_idx" ON "Request"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Shift_userId_idx" ON "Shift"("userId");

-- CreateIndex
CREATE INDEX "Shift_date_idx" ON "Shift"("date");

-- CreateIndex
CREATE INDEX "Shift_userId_date_idx" ON "Shift"("userId", "date");

-- CreateIndex
CREATE INDEX "Shift_userId_startDateTime_idx" ON "Shift"("userId", "startDateTime");

-- CreateIndex
CREATE INDEX "List_userId_idx" ON "List"("userId");

-- CreateIndex
CREATE INDEX "List_userId_order_idx" ON "List"("userId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "List_userId_name_key" ON "List"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Holiday_date_key" ON "Holiday"("date");

-- CreateIndex
CREATE INDEX "Holiday_date_idx" ON "Holiday"("date");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE INDEX "NotificationPreference_userId_idx" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreferences_userId_key" ON "UserPreferences"("userId");

-- CreateIndex
CREATE INDEX "UserPreferences_userId_idx" ON "UserPreferences"("userId");

-- CreateIndex
CREATE INDEX "TutorialSeen_userId_idx" ON "TutorialSeen"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TutorialSeen_userId_pageKey_key" ON "TutorialSeen"("userId", "pageKey");

-- CreateIndex
CREATE INDEX "AutoCheckoutCancellation_userId_idx" ON "AutoCheckoutCancellation"("userId");

-- CreateIndex
CREATE INDEX "AutoCheckoutCancellation_date_idx" ON "AutoCheckoutCancellation"("date");

-- CreateIndex
CREATE UNIQUE INDEX "AutoCheckoutCancellation_userId_date_key" ON "AutoCheckoutCancellation"("userId", "date");

-- CreateIndex
CREATE INDEX "UserWorkDay_userId_idx" ON "UserWorkDay"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserWorkDay_userId_dayOfWeek_key" ON "UserWorkDay"("userId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "WorkTimeAdjustment_userId_idx" ON "WorkTimeAdjustment"("userId");

-- CreateIndex
CREATE INDEX "WorkTimeAdjustment_date_idx" ON "WorkTimeAdjustment"("date");

-- CreateIndex
CREATE UNIQUE INDEX "WorkTimeAdjustment_userId_date_key" ON "WorkTimeAdjustment"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "AutoClockState_userId_key" ON "AutoClockState"("userId");

-- CreateIndex
CREATE INDEX "UrnikRequest_userId_idx" ON "UrnikRequest"("userId");

-- CreateIndex
CREATE INDEX "UrnikRequest_status_idx" ON "UrnikRequest"("status");

-- CreateIndex
CREATE INDEX "UrnikRequest_date_idx" ON "UrnikRequest"("date");

-- CreateIndex
CREATE INDEX "UrnikRequest_category_idx" ON "UrnikRequest"("category");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminUserAssignment" ADD CONSTRAINT "AdminUserAssignment_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminUserAssignment" ADD CONSTRAINT "AdminUserAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HourEntry" ADD CONSTRAINT "HourEntry_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HourEntry" ADD CONSTRAINT "HourEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskTimeEntry" ADD CONSTRAINT "TaskTimeEntry_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskTimeEntry" ADD CONSTRAINT "TaskTimeEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_cancelledBy_fkey" FOREIGN KEY ("cancelledBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_rejectedBy_fkey" FOREIGN KEY ("rejectedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_splitFrom_fkey" FOREIGN KEY ("splitFrom") REFERENCES "Request"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_supersededBy_fkey" FOREIGN KEY ("supersededBy") REFERENCES "Request"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_trimmedBy_fkey" FOREIGN KEY ("trimmedBy") REFERENCES "Request"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "List" ADD CONSTRAINT "List_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPreferences" ADD CONSTRAINT "UserPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutorialSeen" ADD CONSTRAINT "TutorialSeen_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoCheckoutCancellation" ADD CONSTRAINT "AutoCheckoutCancellation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWorkDay" ADD CONSTRAINT "UserWorkDay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkTimeAdjustment" ADD CONSTRAINT "WorkTimeAdjustment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoClockState" ADD CONSTRAINT "AutoClockState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UrnikRequest" ADD CONSTRAINT "UrnikRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

