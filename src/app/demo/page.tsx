"use client"

import { useEffect, useState } from "react"
import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function DemoPage() {
    const router = useRouter()
    const { status } = useSession()
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (status === "authenticated") {
            router.push("/tracker")
            return
        }

        if (status === "unauthenticated") {
            signIn("credentials", {
                email: "demo@example.com",
                password: "password123",
                callbackUrl: "/tracker",
            }).catch(() => {
                setError("Demo login failed. Please ensure database is seeded.")
            })
        }
    }, [status, router])

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <p className="text-red-600">{error}</p>
                    <button
                        onClick={() => router.push("/login")}
                        className="text-blue-600 underline"
                    >
                        Go to login page
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted">
            <div className="text-center space-y-6 p-8">
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold tracking-tight">Welcome to Demo</h1>
                    <p className="text-muted-foreground text-lg">Signing in as demo admin...</p>
                </div>
                <LoadingSpinner size="lg" />
            </div>
        </div>
    )
}
