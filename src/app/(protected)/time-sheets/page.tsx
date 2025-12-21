import { TimeSheetsView } from "./components/time-sheets-view"

export default async function TimeSheetsPage() {
    return (
        <div className="flex flex-col gap-4 h-full">
            <div className="flex-1 overflow-hidden">
                <TimeSheetsView />
            </div>
        </div>
    )
}
