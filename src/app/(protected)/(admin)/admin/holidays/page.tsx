import { Card, CardContent } from "@/components/ui/card"
import { getHolidays } from "./actions/holiday-actions"
import { HolidaysTable } from "./components/holidays-table"
import { SetBreadcrumbData } from "@/features/breadcrumbs"

export default async function HolidaysPage() {
    const result = await getHolidays()
    const holidays = result.success && result.data ? result.data : []

    return (
        <>
            <SetBreadcrumbData
                data={{
                    "/admin/holidays": "Holidays",
                }}
            />
            <div className="flex flex-col gap-6 h-full">
                <Card className="flex-1 flex flex-col">
                    <CardContent className="flex-1 flex flex-col p-6">
                        <HolidaysTable holidays={holidays} />
                    </CardContent>
                </Card>
            </div>
        </>
    )
}
