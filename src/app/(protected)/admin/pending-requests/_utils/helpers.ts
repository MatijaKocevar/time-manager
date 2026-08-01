export { calculateWorkingDays as calculateWorkdays } from "@/lib/date-utils"

export const formatDate = (date: Date, locale: string): string => {
    return new Date(date).toLocaleDateString(locale, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    })
}
