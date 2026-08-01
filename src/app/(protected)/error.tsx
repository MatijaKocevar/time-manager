"use client"

import { useEffect } from "react"

export default function ProtectedError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
            <h2 className="text-xl font-semibold">Something went wrong</h2>
            <p className="text-muted-foreground text-sm">
                An unexpected error occurred. Please try again.
            </p>
            <button
                onClick={reset}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
                Try again
            </button>
        </div>
    )
}
