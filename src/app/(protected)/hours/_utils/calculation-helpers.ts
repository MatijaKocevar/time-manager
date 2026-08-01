export { calculateWorkingDays as calculateWorkingDaysSync } from "@/lib/date-utils"

export function calculateOvertime(
    totalHours: number,
    workingDays: number,
    hoursPerDay: number = 8
): number {
    const expectedHours = workingDays * hoursPerDay
    return totalHours - expectedHours
}
