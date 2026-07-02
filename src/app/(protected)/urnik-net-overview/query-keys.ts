export const urnikNetKeys = {
    all: ["urnikNet"] as const,
    requests: () => [...urnikNetKeys.all, "requests"] as const,
    requestsList: (filters?: { month?: string }) => [...urnikNetKeys.requests(), filters] as const,
    dayInfo: () => [...urnikNetKeys.all, "dayInfo"] as const,
    attendance: () => [...urnikNetKeys.all, "attendance"] as const,
}
