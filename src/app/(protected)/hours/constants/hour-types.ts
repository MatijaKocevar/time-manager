import { getWorkTypeColor } from "@/lib/work-type-styles"

export const ROW_SUFFIXES = {
    TRACKED: "_TRACKED",
    MANUAL: "_MANUAL",
    TOTAL: "_TOTAL",
} as const

export const SPECIAL_TYPES = {
    GRAND_TOTAL: "GRAND_TOTAL",
} as const

export const TASK_ID_VALUES = {
    TOTAL: "total",
    TRACKED: "tracked",
    GRAND_TOTAL: "grand_total",
} as const

export const HOUR_TYPE_VALUES = {
    WORK: "WORK",
    VACATION: "VACATION",
    SICK_LEAVE: "SICK_LEAVE",
    WORK_FROM_HOME: "WORK_FROM_HOME",
    OTHER: "OTHER",
    BREAK: "BREAK",
    PRIVATE: "PRIVATE",
} as const

export const ALL_HOUR_TYPES = [
    HOUR_TYPE_VALUES.WORK,
    HOUR_TYPE_VALUES.WORK_FROM_HOME,
    HOUR_TYPE_VALUES.VACATION,
    HOUR_TYPE_VALUES.SICK_LEAVE,
    HOUR_TYPE_VALUES.OTHER,
    HOUR_TYPE_VALUES.BREAK,
    HOUR_TYPE_VALUES.PRIVATE,
] as const

export const HOUR_TYPES = [
    { value: HOUR_TYPE_VALUES.WORK },
    { value: HOUR_TYPE_VALUES.WORK_FROM_HOME },
    { value: HOUR_TYPE_VALUES.VACATION },
    { value: HOUR_TYPE_VALUES.SICK_LEAVE },
    { value: HOUR_TYPE_VALUES.OTHER },
    { value: HOUR_TYPE_VALUES.BREAK },
    { value: HOUR_TYPE_VALUES.PRIVATE },
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
    BREAK: getWorkTypeColor("BREAK", "default"),
    BREAK_TRACKED: getWorkTypeColor("BREAK", "default"),
    BREAK_MANUAL: getWorkTypeColor("BREAK", "light"),
    BREAK_TOTAL: getWorkTypeColor("BREAK", "strong"),
    PRIVATE: getWorkTypeColor("PRIVATE", "default"),
    PRIVATE_TRACKED: getWorkTypeColor("PRIVATE", "default"),
    PRIVATE_MANUAL: getWorkTypeColor("PRIVATE", "light"),
    PRIVATE_TOTAL: getWorkTypeColor("PRIVATE", "strong"),
} as const

export const ROW_BG_COLORS = {
    GRAND_TOTAL: "bg-slate-500/20 dark:bg-slate-500/25",
    WORK_TOTAL: "bg-blue-500/10 dark:bg-blue-500/15",
    WORK_TRACKED: "bg-blue-500/5 dark:bg-blue-500/10",
    WORK_MANUAL: "bg-blue-500/5 dark:bg-blue-500/10",
    VACATION_TOTAL: "bg-green-500/10 dark:bg-green-500/15",
    VACATION_TRACKED: "bg-green-500/5 dark:bg-green-500/10",
    VACATION_MANUAL: "bg-green-500/5 dark:bg-green-500/10",
    SICK_LEAVE_TOTAL: "bg-[#433600]/10 dark:bg-[#433600]/15",
    SICK_LEAVE_TRACKED: "bg-[#433600]/5 dark:bg-[#433600]/10",
    SICK_LEAVE_MANUAL: "bg-[#433600]/5 dark:bg-[#433600]/10",
    WORK_FROM_HOME_TOTAL: "bg-purple-500/10 dark:bg-purple-500/15",
    WORK_FROM_HOME_TRACKED: "bg-purple-500/5 dark:bg-purple-500/10",
    WORK_FROM_HOME_MANUAL: "bg-purple-500/5 dark:bg-purple-500/10",
    OTHER_TOTAL: "bg-gray-500/10 dark:bg-gray-500/15",
    OTHER_TRACKED: "bg-gray-500/5 dark:bg-gray-500/10",
    OTHER_MANUAL: "bg-gray-500/5 dark:bg-gray-500/10",
    BREAK_TOTAL: "bg-yellow-500/10 dark:bg-yellow-500/15",
    BREAK_TRACKED: "bg-yellow-500/5 dark:bg-yellow-500/10",
    BREAK_MANUAL: "bg-yellow-500/5 dark:bg-yellow-500/10",
    PRIVATE_TOTAL: "bg-cyan-500/10 dark:bg-cyan-500/15",
    PRIVATE_TRACKED: "bg-cyan-500/5 dark:bg-cyan-500/10",
    PRIVATE_MANUAL: "bg-cyan-500/5 dark:bg-cyan-500/10",
} as const

export const DEFAULT_HOURS = 8
export const MAX_HOURS_PER_DAY = 24
