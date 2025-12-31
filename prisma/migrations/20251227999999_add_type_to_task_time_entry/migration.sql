-- Add type field to TaskTimeEntry
ALTER TABLE "TaskTimeEntry" ADD COLUMN "type" "HourType" NOT NULL DEFAULT 'WORK';
