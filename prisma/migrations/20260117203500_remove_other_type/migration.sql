-- Step 1: Drop materialized view that depends on the enums
DROP MATERIALIZED VIEW IF EXISTS daily_hour_summary CASCADE;

-- Step 2: Convert all OTHER type records to WORK
UPDATE "HourEntry" SET type = 'WORK' WHERE type = 'OTHER';

UPDATE "TaskTimeEntry" SET type = 'WORK' WHERE type = 'OTHER';

UPDATE "Shift" SET location = 'OFFICE' WHERE location = 'OTHER';

-- Step 3: Create temporary new enums without OTHER
CREATE TYPE "HourType_new" AS ENUM ('WORK', 'VACATION', 'SICK_LEAVE', 'WORK_FROM_HOME', 'BREAK', 'PRIVATE');

CREATE TYPE "RequestType_new" AS ENUM ('VACATION', 'SICK_LEAVE', 'WORK_FROM_HOME');

CREATE TYPE "ShiftLocation_new" AS ENUM ('OFFICE', 'HOME', 'VACATION', 'SICK_LEAVE');

-- Step 4: Update columns to use new types (drop defaults first)
ALTER TABLE "HourEntry" ALTER COLUMN type DROP DEFAULT;

ALTER TABLE "TaskTimeEntry" ALTER COLUMN type DROP DEFAULT;

ALTER TABLE "User" ALTER COLUMN "trackerSelectedType" DROP DEFAULT;

ALTER TABLE "Shift" ALTER COLUMN location DROP DEFAULT;

ALTER TABLE "HourEntry" ALTER COLUMN type TYPE "HourType_new" USING (type::text::"HourType_new");

ALTER TABLE "TaskTimeEntry" ALTER COLUMN type TYPE "HourType_new" USING (type::text::"HourType_new");

ALTER TABLE "User" ALTER COLUMN "trackerSelectedType" TYPE "HourType_new" USING ("trackerSelectedType"::text::"HourType_new");

-- Handle Request table - convert any OTHER requests to WORK_FROM_HOME before changing enum
UPDATE "Request" SET type = 'WORK_FROM_HOME' WHERE type = 'OTHER';

ALTER TABLE "Request" ALTER COLUMN type TYPE "RequestType_new" USING (type::text::"RequestType_new");

ALTER TABLE "Shift" ALTER COLUMN location TYPE "ShiftLocation_new" USING (location::text::"ShiftLocation_new");

-- Restore defaults
ALTER TABLE "HourEntry" ALTER COLUMN type SET DEFAULT 'WORK'::"HourType_new";

ALTER TABLE "TaskTimeEntry" ALTER COLUMN type SET DEFAULT 'WORK'::"HourType_new";

ALTER TABLE "User" ALTER COLUMN "trackerSelectedType" SET DEFAULT 'WORK'::"HourType_new";

ALTER TABLE "Shift" ALTER COLUMN location SET DEFAULT 'OFFICE'::"ShiftLocation_new";

-- Step 5: Drop old enums and rename new ones
DROP TYPE "HourType";

DROP TYPE "RequestType";

DROP TYPE "ShiftLocation";

ALTER TYPE "HourType_new" RENAME TO "HourType";

ALTER TYPE "RequestType_new" RENAME TO "RequestType";

ALTER TYPE "ShiftLocation_new" RENAME TO "ShiftLocation";

-- Step 6: Recreate materialized view without OTHER

CREATE MATERIALIZED VIEW daily_hour_summary AS
WITH date_range AS (
    SELECT DISTINCT
        "userId" AS user_id,
        DATE(date) AS normalized_date,
        type
    FROM "HourEntry"
    WHERE "taskId" IS NULL
    
    UNION
    
    SELECT DISTINCT
        "userId" AS user_id,
        DATE("startTime") AS normalized_date,
        'WORK'::"HourType" AS type
    FROM "TaskTimeEntry"
    WHERE "endTime" IS NOT NULL 
        AND duration IS NOT NULL
),
manual_hours AS (
    SELECT
        "userId" AS user_id,
        DATE(date) AS normalized_date,
        type,
        COALESCE(SUM(hours), 0) AS manual_hours
    FROM "HourEntry"
    WHERE "taskId" IS NULL
    GROUP BY "userId", DATE(date), type
),
tracked_hours_base AS (
    SELECT
        "userId" AS user_id,
        DATE("startTime") AS normalized_date,
        COALESCE(SUM(duration), 0) / 3600.0 AS tracked_hours_seconds
    FROM "TaskTimeEntry"
    WHERE "endTime" IS NOT NULL 
        AND duration IS NOT NULL
    GROUP BY "userId", DATE("startTime")
),
request_hour_types AS (
    SELECT DISTINCT ON ("userId", DATE(date_in_range))
        "userId" AS user_id,
        DATE(date_in_range) AS normalized_date,
        CASE type
            WHEN 'VACATION' THEN 'VACATION'::"HourType"
            WHEN 'SICK_LEAVE' THEN 'SICK_LEAVE'::"HourType"
            WHEN 'WORK_FROM_HOME' THEN 'WORK_FROM_HOME'::"HourType"
            ELSE 'WORK'::"HourType"
        END AS hour_type
    FROM "Request",
    LATERAL generate_series("startDate", "endDate", '1 day'::interval) AS date_in_range
    WHERE status = 'APPROVED'
        AND "affectsHourType" = true
        AND "cancelledAt" IS NULL
    ORDER BY "userId", DATE(date_in_range), "approvedAt" DESC
),
all_combinations AS (
    SELECT DISTINCT
        COALESCE(dr.user_id, mh.user_id, th.user_id) AS user_id,
        COALESCE(dr.normalized_date, mh.normalized_date, th.normalized_date) AS normalized_date,
        dr.type
    FROM date_range dr
    FULL OUTER JOIN manual_hours mh 
        ON dr.user_id = mh.user_id 
        AND dr.normalized_date = mh.normalized_date 
        AND dr.type = mh.type
    FULL OUTER JOIN tracked_hours_base th 
        ON COALESCE(dr.user_id, mh.user_id) = th.user_id 
        AND COALESCE(dr.normalized_date, mh.normalized_date) = th.normalized_date
)
SELECT
    gen_random_uuid() AS id,
    ac.user_id AS "userId",
    ac.normalized_date AS date,
    ac.type,
    COALESCE(mh.manual_hours, 0) AS "manualHours",
    CASE 
        WHEN COALESCE(rht.hour_type, 'WORK'::"HourType") = ac.type 
        THEN COALESCE(th.tracked_hours_seconds, 0)
        ELSE 0
    END AS "trackedHours",
    COALESCE(mh.manual_hours, 0) + 
    CASE 
        WHEN COALESCE(rht.hour_type, 'WORK'::"HourType") = ac.type 
        THEN COALESCE(th.tracked_hours_seconds, 0)
        ELSE 0
    END AS "totalHours",
    NOW() AS "createdAt",
    NOW() AS "updatedAt"
FROM all_combinations ac
LEFT JOIN manual_hours mh 
    ON ac.user_id = mh.user_id 
    AND ac.normalized_date = mh.normalized_date 
    AND ac.type = mh.type
LEFT JOIN tracked_hours_base th 
    ON ac.user_id = th.user_id 
    AND ac.normalized_date = th.normalized_date
LEFT JOIN request_hour_types rht
    ON ac.user_id = rht.user_id
    AND ac.normalized_date = rht.normalized_date;

-- Step 7: Create unique index for the view
CREATE UNIQUE INDEX daily_hour_summary_userId_date_type_key ON daily_hour_summary("userId", date, type);