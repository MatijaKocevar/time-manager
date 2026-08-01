export const yearlyCalendarKeys = {
    all: ["yearlyCalendar"] as const,
    years: () => [...yearlyCalendarKeys.all, "year"] as const,
    year: (year: number) => [...yearlyCalendarKeys.years(), year] as const,
    balances: () => [...yearlyCalendarKeys.all, "balance"] as const,
    balance: (year: number) => [...yearlyCalendarKeys.balances(), year] as const,
}
