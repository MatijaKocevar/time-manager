import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function AdminOverviewLoading() {
    return (
        <div className="flex items-center justify-center h-full">
            <LoadingSpinner />
        </div>
    )
}
