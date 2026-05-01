import { getTranslations } from "next-intl/server"
import { UserHoursSectionClient } from "./user-hours-section"
import type { HourEntryDisplay } from "@/app/(protected)/hours/schemas/hour-entry-schemas"

interface UserHoursSectionProps {
    userId: string
    workHoursPerDay: number | null
    initialEntries: HourEntryDisplay[]
    initialHolidays?: Array<{ date: Date }>
    initialAttendanceData?: { officeCount: number; remoteCount: number }
}

export async function UserHoursSection({
    userId,
    workHoursPerDay,
    initialEntries,
    initialHolidays = [],
    initialAttendanceData,
}: UserHoursSectionProps) {
    const [t, tCommon] = await Promise.all([
        getTranslations("admin.users.detail"),
        getTranslations("common.actions"),
    ])

    return (
        <UserHoursSectionClient
            userId={userId}
            workHoursPerDay={workHoursPerDay}
            initialEntries={initialEntries}
            initialHolidays={initialHolidays}
            initialAttendanceData={initialAttendanceData}
            translations={{
                title: t("hoursSummary"),
                description: t("hoursSummaryDescription"),
                exportLabel: tCommon("export"),
            }}
        />
    )
}
