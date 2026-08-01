export const ROLE_COLORS = {
    ADMIN: "bg-purple-100 text-purple-800",
    USER: "bg-blue-100 text-blue-800",
} as const

export const MIN_PASSWORD_LENGTH = 6
export const BCRYPT_SALT_ROUNDS = 12

export const TIME_PICKER_CONFIG = {
    INTERVALS_PER_HOUR: 4,
    MINUTES_PER_INTERVAL: 15,
    TOTAL_INTERVALS: 96,
    HOURS_PER_DAY: 24,
} as const

export const DEFAULT_WORK_HOURS = {
    START_TIME: "08:00",
    END_TIME: "16:00",
    HOURS_PER_DAY: 8,
} as const

export const WORK_HOURS_VALIDATION = {
    MIN_HOURS_PER_DAY: 0.25,
    MAX_HOURS_PER_DAY: 24,
} as const
