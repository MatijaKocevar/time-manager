import type { HourType } from "@/../../prisma/generated/client"

export const HOUR_TYPE_ABBREVIATIONS: Record<HourType, string> = {
    WORK: "W",
    WORK_FROM_HOME: "WFH",
    VACATION: "V",
    SICK_LEAVE: "SL",
    BREAK: "B",
    PRIVATE: "P",
}
