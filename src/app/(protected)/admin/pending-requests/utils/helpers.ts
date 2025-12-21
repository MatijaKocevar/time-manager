export const calculateWorkdays = (
    startDate: Date,
    endDate: Date,
    holidays: Array<{ date: Date; name: string }>
): number => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    let count = 0

    const holidayDates = new Set(
        holidays.map((h) => {
            const d = new Date(h.date)
            d.setHours(0, 0, 0, 0)
            return d.getTime()
        })
    )

    const current = new Date(start)
    while (current <= end) {
        const day = current.getDay()
        const currentTime = new Date(current)
        currentTime.setHours(0, 0, 0, 0)
        const isHoliday = holidayDates.has(currentTime.getTime())

        if (day !== 0 && day !== 6 && !isHoliday) {
            count++
        }
        current.setDate(current.getDate() + 1)
    }

    return count
}

export const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString()
}
