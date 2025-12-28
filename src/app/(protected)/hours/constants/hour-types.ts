import { getWorkTypeColor, type WorkType } from "@/lib/work-type-styles"

export const HOUR_TYPES = [
    { value: "WORK", label: "Work" },
    { value: "WORK_FROM_HOME", label: "Work From Home" },
    { value: "VACATION", label: "Vacation" },
    { value: "SICK_LEAVE", label: "Sick Leave" },
    { value: "OTHER", label: "Other" },
] as const

export const HOUR_TYPE_COLORS = {
    GRAND_TOTAL: "bg-slate-300 text-slate-950 dark:bg-slate-700 dark:text-slate-50",
    WORK: getWorkTypeColor("WORK", "default"),
    WORK_TRACKED: getWorkTypeColor("WORK", "default"),
    WORK_MANUAL: getWorkTypeColor("WORK", "light"),
    WORK_TOTAL: getWorkTypeColor("WORK", "strong"),
    VACATION: getWorkTypeColor("VACATION", "default"),
    VACATION_TRACKED: getWorkTypeColor("VACATION", "default"),
    VACATION_MANUAL: getWorkTypeColor("VACATION", "light"),
    VACATION_TOTAL: getWorkTypeColor("VACATION", "strong"),
    SICK_LEAVE: getWorkTypeColor("SICK_LEAVE", "default"),
    SICK_LEAVE_TRACKED: getWorkTypeColor("SICK_LEAVE", "default"),
    SICK_LEAVE_MANUAL: getWorkTypeColor("SICK_LEAVE", "light"),
    SICK_LEAVE_TOTAL: getWorkTypeColor("SICK_LEAVE", "strong"),
    WORK_FROM_HOME: getWorkTypeColor("WORK_FROM_HOME", "default"),
    WORK_FROM_HOME_TRACKED: getWorkTypeColor("WORK_FROM_HOME", "default"),
    WORK_FROM_HOME_MANUAL: getWorkTypeColor("WORK_FROM_HOME", "light"),
    WORK_FROM_HOME_TOTAL: getWorkTypeColor("WORK_FROM_HOME", "strong"),
    OTHER: getWorkTypeColor("OTHER", "default"),
    OTHER_TRACKED: getWorkTypeColor("OTHER", "default"),
    OTHER_MANUAL: getWorkTypeColor("OTHER", "light"),
    OTHER_TOTAL: getWorkTypeColor("OTHER", "strong"),
} as const

export const ROW_BG_COLORS = {
    GRAND_TOTAL: "bg-slate-500/20 dark:bg-slate-500/25",
    WORK_TOTAL: "bg-blue-500/10 dark:bg-blue-500/15",
    WORK_TRACKED: "bg-blue-500/5 dark:bg-blue-500/10",
    WORK_MANUAL: "bg-blue-500/5 dark:bg-blue-500/10",
    VACATION_TOTAL: "bg-green-500/10 dark:bg-green-500/15",
    VACATION_TRACKED: "bg-green-500/5 dark:bg-green-500/10",
    VACATION_MANUAL: "bg-green-500/5 dark:bg-green-500/10",
    SICK_LEAVE_TOTAL: "bg-red-500/10 dark:bg-red-500/15",
    SICK_LEAVE_TRACKED: "bg-red-500/5 dark:bg-red-500/10",
    SICK_LEAVE_MANUAL: "bg-red-500/5 dark:bg-red-500/10",
    WORK_FROM_HOME_TOTAL: "bg-purple-500/10 dark:bg-purple-500/15",
    WORK_FROM_HOME_TRACKED: "bg-purple-500/5 dark:bg-purple-500/10",
    WORK_FROM_HOME_MANUAL: "bg-purple-500/5 dark:bg-purple-500/10",
    OTHER_TOTAL: "bg-gray-500/10 dark:bg-gray-500/15",
    OTHER_TRACKED: "bg-gray-500/5 dark:bg-gray-500/10",
    OTHER_MANUAL: "bg-gray-500/5 dark:bg-gray-500/10",
} as const

export const HOUR_TYPE_LABELS = {
    WORK: "Work",
    WORK_FROM_HOME: "Work From Home",
    VACATION: "Vacation",
    SICK_LEAVE: "Sick Leave",
    OTHER: "Other",
    GRAND_TOTAL: "TOTAL",
    TOTAL: "TOTAL",
    TRACKED: "TRACKED",
} as const

export const DEFAULT_HOURS = 8
export const MAX_HOURS_PER_DAY = 24
