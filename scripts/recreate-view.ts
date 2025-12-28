import { PrismaClient } from '../prisma/generated/client'

const prisma = new PrismaClient()

const createViewSQL = `
CREATE MATERIALIZED VIEW daily_hour_summary AS
WITH date_range AS (
    SELECT DISTINCT
        "userId" AS user_id,
        DATE(date AT TIME ZONE 'UTC') AS normalized_date,
        type
    FROM "HourEntry"
    WHERE "taskId" IS NULL
    
    UNION
    
    SELECT DISTINCT
        "userId" AS user_id,
        DATE("startTime" AT TIME ZONE 'UTC') AS normalized_date,
        'WORK'::"HourType" AS type
    FROM "TaskTimeEntry"
    WHERE "endTime" IS NOT NULL 
        AND duration IS NOT NULL
),
manual_hours AS (
    SELECT
        "userId" AS user_id,
        DATE(date AT TIME ZONE 'UTC') AS normalized_date,
        type,
        COALESCE(SUM(hours), 0) AS manual_hours
    FROM "HourEntry"
    WHERE "taskId" IS NULL
    GROUP BY "userId", DATE(date AT TIME ZONE 'UTC'), type
),
tracked_hours_base AS (
    SELECT
        "userId" AS user_id,
        DATE("startTime" AT TIME ZONE 'UTC') AS normalized_date,
        COALESCE(SUM(duration), 0) / 3600.0 AS tracked_hours_seconds
    FROM "TaskTimeEntry"
    WHERE "endTime" IS NOT NULL 
        AND duration IS NOT NULL
    GROUP BY "userId", DATE("startTime" AT TIME ZONE 'UTC')
),
request_hour_types AS (
    SELECT DISTINCT ON ("userId", DATE(date_in_range AT TIME ZONE 'UTC'))
        "userId" AS user_id,
        DATE(date_in_range AT TIME ZONE 'UTC') AS normalized_date,
        CASE type
            WHEN 'VACATION' THEN 'VACATION'::"HourType"
            WHEN 'SICK_LEAVE' THEN 'SICK_LEAVE'::"HourType"
            WHEN 'WORK_FROM_HOME' THEN 'WORK_FROM_HOME'::"HourType"
            WHEN 'OTHER' THEN 'OTHER'::"HourType"
            ELSE 'WORK'::"HourType"
        END AS hour_type
    FROM "Request",
    LATERAL generate_series("startDate", "endDate", '1 day'::interval) AS date_in_range
    WHERE status = 'APPROVED'
        AND "affectsHourType" = true
        AND "cancelledAt" IS NULL
    ORDER BY "userId", DATE(date_in_range AT TIME ZONE 'UTC'), "approvedAt" DESC
),
all_combinations AS (
    SELECT DISTINCT
        COALESCE(dr.user_id, mh.user_id, th.user_id, rht.user_id) AS user_id,
        COALESCE(dr.normalized_date, mh.normalized_date, th.normalized_date, rht.normalized_date) AS normalized_date,
        COALESCE(rht.hour_type, dr.type, 'WORK'::"HourType") AS type
    FROM date_range dr
    FULL OUTER JOIN manual_hours mh 
        ON dr.user_id = mh.user_id 
        AND dr.normalized_date = mh.normalized_date 
        AND dr.type = mh.type
    FULL OUTER JOIN tracked_hours_base th 
        ON COALESCE(dr.user_id, mh.user_id) = th.user_id 
        AND COALESCE(dr.normalized_date, mh.normalized_date) = th.normalized_date
    FULL OUTER JOIN request_hour_types rht
        ON COALESCE(dr.user_id, mh.user_id, th.user_id) = rht.user_id
        AND COALESCE(dr.normalized_date, mh.normalized_date, th.normalized_date) = rht.normalized_date
)
SELECT
    gen_random_uuid() AS id,
    ac.user_id AS "userId",
    ac.normalized_date AS date,
    ac.type,
    COALESCE(mh.manual_hours, 0) AS "manualHours",
    CASE 
        WHEN ac.type = COALESCE(rht.hour_type, 'WORK'::"HourType")
        THEN COALESCE(th.tracked_hours_seconds, 0)
        ELSE 0
    END AS "trackedHours",
    COALESCE(mh.manual_hours, 0) + 
    CASE 
        WHEN ac.type = COALESCE(rht.hour_type, 'WORK'::"HourType")
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
    AND ac.normalized_date = rht.normalized_date
WHERE COALESCE(mh.manual_hours, 0) > 0 
    OR (
        ac.type = COALESCE(rht.hour_type, 'WORK'::"HourType")
        AND COALESCE(th.tracked_hours_seconds, 0) > 0
    )
`

async function recreate() {
    console.log('Creating materialized view...')
    await prisma.$executeRawUnsafe(createViewSQL)
    console.log('✓ Created')
    
    console.log('Creating indexes...')
    await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX daily_hour_summary_unique_idx ON daily_hour_summary ("userId", date, type)')
    await prisma.$executeRawUnsafe('CREATE INDEX daily_hour_summary_user_idx ON daily_hour_summary ("userId")')
    await prisma.$executeRawUnsafe('CREATE INDEX daily_hour_summary_date_idx ON daily_hour_summary (date)')
    await prisma.$executeRawUnsafe('CREATE INDEX daily_hour_summary_user_date_idx ON daily_hour_summary ("userId", date)')
    console.log('✓ Indexes created')
    
    await prisma.$disconnect()
    console.log('\nDone!')
}

recreate()
