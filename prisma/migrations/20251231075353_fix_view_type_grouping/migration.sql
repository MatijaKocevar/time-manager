-- Fix materialized view to properly include all types from all sources
-- The old view was using dr.type from date_range in all_combinations, which caused
-- tracked hours from types not in date_range to be summed into the wrong type

DROP MATERIALIZED VIEW IF EXISTS daily_hour_summary;


CREATE MATERIALIZED VIEW daily_hour_summary AS
WITH date_range AS (
    -- Get all user/date/type combinations from manual entries
    SELECT DISTINCT
        "userId" AS user_id,
        DATE(date AT TIME ZONE 'UTC') AS normalized_date,
        type
    FROM "HourEntry"
    WHERE "taskId" IS NULL
    
    UNION

-- Get all user/date/type combinations from tracked entries
SELECT DISTINCT
    "userId" AS user_id,
    DATE(
        "startTime" AT TIME ZONE 'UTC'
    ) AS normalized_date,
    type
FROM "TaskTimeEntry"
WHERE
    "endTime" IS NOT NULL
    AND duration IS NOT NULL
UNION

-- Get all user/date/type combinations from approved requests
SELECT DISTINCT
        "userId" AS user_id,
        DATE(date_in_range AT TIME ZONE 'UTC') AS normalized_date,
        CASE type
            WHEN 'VACATION' THEN 'VACATION'::"HourType"
            WHEN 'SICK_LEAVE' THEN 'SICK_LEAVE'::"HourType"
            WHEN 'WORK_FROM_HOME' THEN 'WORK_FROM_HOME'::"HourType"
            WHEN 'OTHER' THEN 'OTHER'::"HourType"
            ELSE 'WORK'::"HourType"
        END AS type
    FROM "Request",
    LATERAL generate_series("startDate", "endDate", '1 day'::interval) AS date_in_range
    WHERE status = 'APPROVED'
        AND "affectsHourType" = true
        AND "cancelledAt" IS NULL
        AND EXTRACT(DOW FROM date_in_range) NOT IN (0, 6)
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
        type,
        COALESCE(SUM(duration), 0) / 3600.0 AS tracked_hours_seconds
    FROM "TaskTimeEntry"
    WHERE "endTime" IS NOT NULL 
        AND duration IS NOT NULL
    GROUP BY "userId", DATE("startTime" AT TIME ZONE 'UTC'), type
)
SELECT
    gen_random_uuid() AS id,
    dr.user_id AS "userId",
    dr.normalized_date AS date,
    dr.type,
    COALESCE(mh.manual_hours, 0) AS "manualHours",
    COALESCE(th.tracked_hours_seconds, 0) AS "trackedHours",
    COALESCE(mh.manual_hours, 0) + COALESCE(th.tracked_hours_seconds, 0) AS "totalHours",
    NOW() AS "createdAt",
    NOW() AS "updatedAt"
FROM date_range dr
LEFT JOIN manual_hours mh 
    ON dr.user_id = mh.user_id 
    AND dr.normalized_date = mh.normalized_date 
    AND dr.type = mh.type
LEFT JOIN tracked_hours_base th 
    ON dr.user_id = th.user_id 
    AND dr.normalized_date = th.normalized_date
    AND dr.type = th.type
WHERE COALESCE(mh.manual_hours, 0) > 0 
    OR COALESCE(th.tracked_hours_seconds, 0) > 0;

-- Create unique index to enable CONCURRENTLY refresh
CREATE UNIQUE INDEX daily_hour_summary_unique_idx 
ON daily_hour_summary ("userId", date, type);

-- Create additional indexes for query performance
CREATE INDEX daily_hour_summary_user_idx ON daily_hour_summary ("userId");

CREATE INDEX daily_hour_summary_date_idx ON daily_hour_summary (date);

CREATE INDEX daily_hour_summary_user_date_idx ON daily_hour_summary ("userId", date);