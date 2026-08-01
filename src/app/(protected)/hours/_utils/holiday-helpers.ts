export function isHolidayFromList(date: Date, holidays: Array<{ date: Date }>): boolean {
    const normalizedDate = new Date(date)
    normalizedDate.setHours(0, 0, 0, 0)
    const dateTime = normalizedDate.getTime()

    return holidays.some((holiday) => {
        const holidayDate = new Date(holiday.date)
        holidayDate.setHours(0, 0, 0, 0)
        return holidayDate.getTime() === dateTime
    })
}
