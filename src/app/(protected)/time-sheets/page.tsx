import { TimeSheetsView } from "./components/time-sheets-view"

interface TimeSheetsPageProps {
    searchParams: Promise<{ mode?: string; date?: string }>
}

export default async function TimeSheetsPage({ searchParams }: TimeSheetsPageProps) {
    const params = await searchParams

    return (
        <div className="flex flex-col gap-4 h-full">
            <div className="flex-1 overflow-hidden">
                <TimeSheetsView searchParams={params} />
            </div>
        </div>
    )
}
