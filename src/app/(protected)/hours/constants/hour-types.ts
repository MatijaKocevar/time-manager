export const HOUR_TYPES = [
    { value: "WORK", label: "Work" },
    { value: "WORK_FROM_HOME", label: "Work From Home" },
    { value: "VACATION", label: "Vacation" },
    { value: "SICK_LEAVE", label: "Sick Leave" },
    { value: "OTHER", label: "Other" },
] as const

export const HOUR_TYPE_COLORS = {
    GRAND_TOTAL: "bg-slate-300 text-slate-950 dark:bg-slate-700 dark:text-slate-50",
    WORK: "bg-blue-100 text-blue-800",
    WORK_TRACKED: "bg-blue-100 text-blue-800",
    WORK_MANUAL: "bg-blue-50 text-blue-700",
    WORK_TOTAL: "bg-blue-200 text-blue-900",
    VACATION: "bg-green-100 text-green-800",
    VACATION_TRACKED: "bg-green-100 text-green-800",
    VACATION_MANUAL: "bg-green-50 text-green-700",
    VACATION_TOTAL: "bg-green-200 text-green-900",
    SICK_LEAVE: "bg-red-100 text-red-800",
    SICK_LEAVE_TRACKED: "bg-red-100 text-red-800",
    SICK_LEAVE_MANUAL: "bg-red-50 text-red-700",
    SICK_LEAVE_TOTAL: "bg-red-200 text-red-900",
    WORK_FROM_HOME: "bg-purple-100 text-purple-800",
    WORK_FROM_HOME_TRACKED: "bg-purple-100 text-purple-800",
    WORK_FROM_HOME_MANUAL: "bg-purple-50 text-purple-700",
    WORK_FROM_HOME_TOTAL: "bg-purple-200 text-purple-900",
    OTHER: "bg-gray-100 text-gray-800",
    OTHER_TRACKED: "bg-gray-100 text-gray-800",
    OTHER_MANUAL: "bg-gray-50 text-gray-700",
    OTHER_TOTAL: "bg-gray-200 text-gray-900",
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
