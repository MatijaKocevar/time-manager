export interface OvertimeRequestLike {
    isFullDay: boolean
    startDate: Date
    endDate: Date
    requestedHours: number | null
    skipWeekends: boolean
    skipHolidays: boolean
}

export function countOvertimeWorkDays(
    request: OvertimeRequestLike,
    holidays: Array<{ date: Date }>
): number {
    const startDay = new Date(request.startDate)
    startDay.setUTCHours(0, 0, 0, 0)
    const endDay = new Date(request.endDate)
    endDay.setUTCHours(0, 0, 0, 0)

    const daysDiff = Math.round((endDay.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24))

    let workDays = 0

    for (let i = 0; i <= daysDiff; i++) {
        const currentDay = new Date(startDay)
        currentDay.setUTCDate(startDay.getUTCDate() + i)

        const dayOfWeek = currentDay.getUTCDay()
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

        const isHoliday = holidays.some((holiday) => {
            const holidayDate = new Date(holiday.date)
            holidayDate.setUTCHours(0, 0, 0, 0)
            return holidayDate.getTime() === currentDay.getTime()
        })

        const shouldSkip =
            (request.skipWeekends && isWeekend) || (request.skipHolidays && isHoliday)

        if (!shouldSkip) {
            workDays++
        }
    }

    return workDays
}

export function calculateOvertimeUseHours(
    request: OvertimeRequestLike,
    workHoursPerDay: number,
    holidays: Array<{ date: Date }>
): number {
    const workDays = countOvertimeWorkDays(request, holidays)

    if (workDays === 0) {
        return 0
    }

    if (!request.isFullDay && request.requestedHours !== null) {
        return Number(request.requestedHours) * workDays
    }

    return workHoursPerDay * workDays
}
