-- Drop and recreate the materialized view with UTC date handling

DROP MATERIALIZED VIEW IF EXISTS daily_hour_summary;


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
        type
    FROM "TaskTimeEntry"
    WHERE "endTime" IS NOT NULL 
        AND duration IS NOT NULL
    
    UNION

-- Add approved request types to ensure rows are created for them
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
        AND dr.type = th.type
)
SELECT
    gen_random_uuid() AS id,
    ac.user_id AS "userId",
    ac.normalized_date AS date,
    ac.type,
    COALESCE(mh.manual_hours, 0) AS "manualHours",
    COALESCE(th.tracked_hours_seconds, 0) AS "trackedHours",
    COALESCE(mh.manual_hours, 0) + COALESCE(th.tracked_hours_seconds, 0) AS "totalHours",
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
    AND ac.type = th.type
LEFT JOIN request_hour_types rht 
    ON ac.user_id = rht.user_id 
    AND ac.normalized_date = rht.normalized_date
WHERE COALESCE(mh.manual_hours, 0) > 0 
    OR COALESCE(th.tracked_hours_seconds, 0) > 0;

-- Create unique index to enable CONCURRENTLY refresh
CREATE UNIQUE INDEX daily_hour_summary_unique_idx 
ON daily_hour_summary ("userId", date, type);

-- Create additional indexes for query performance
CREATE INDEX daily_hour_summary_user_idx ON daily_hour_summary ("userId");

CREATE INDEX daily_hour_summary_date_idx ON daily_hour_summary (date);

CREATE INDEX daily_hour_summary_user_date_idx ON daily_hour_summary ("userId", date);