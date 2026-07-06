"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { AlertCircle, AlertTriangle, Search } from "lucide-react"
import type { ParsedAttendanceResult, UserStatus } from "../schemas/attendance-schema"

interface AttendanceViewProps {
    result: ParsedAttendanceResult
    translations: {
        pageTitle: string
        present: string
        absent: string
        unreachable: string
        workFromHome: string
        noData: string
        search: string
        showing: string
        errorTitle: string
        structureChangedWarning: string
        structureChangedDescription: string
    }
}

const statusConfig: Record<string, { bg: string; ring: string }> = {
    Present: { bg: "bg-emerald-500", ring: "ring-emerald-500" },
    "Work From Home": { bg: "bg-blue-500", ring: "ring-blue-500" },
    Unreachable: { bg: "bg-amber-500", ring: "ring-amber-500" },
    Absent: { bg: "bg-zinc-400", ring: "ring-zinc-400" },
}

function statusLabel(status: string, t: AttendanceViewProps["translations"]): string {
    switch (status) {
        case "Present":
            return t.present
        case "Work From Home":
            return t.workFromHome
        case "Unreachable":
            return t.unreachable
        default:
            return t.absent
    }
}

function UserCard({
    user,
    translations,
}: {
    user: UserStatus
    translations: AttendanceViewProps["translations"]
}) {
    const config = statusConfig[user.status] ?? statusConfig.Absent

    return (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-border/60 bg-card/50 hover:bg-card hover:shadow-sm transition-all">
            <div
                className={`h-11 w-11 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-muted ring-[3px] ${config.ring}`}
            >
                {user.imageUrl ? (
                    <Image
                        src={user.imageUrl}
                        alt={user.name}
                        width={44}
                        height={44}
                        className="rounded-full object-cover"
                    />
                ) : (
                    <span className="text-white font-semibold text-sm">
                        {user.name
                            .split(" ")
                            .map((part) => part[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                    </span>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground">
                    {statusLabel(user.status, translations)}
                </p>
            </div>
        </div>
    )
}

export function AttendanceView({ result, translations }: AttendanceViewProps) {
    const [query, setQuery] = useState("")
    const [debouncedQuery, setDebouncedQuery] = useState("")

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query), 200)
        return () => clearTimeout(timer)
    }, [query])

    if (!result.success) {
        return (
            <div className="space-y-4">
                {!result.structureValid ? (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>{translations.structureChangedWarning}</AlertTitle>
                        <AlertDescription>
                            {translations.structureChangedDescription}
                        </AlertDescription>
                    </Alert>
                ) : (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>{translations.errorTitle}</AlertTitle>
                        <AlertDescription>{result.error}</AlertDescription>
                    </Alert>
                )}
            </div>
        )
    }

    if (!result.data) {
        return <p className="text-muted-foreground">{translations.noData}</p>
    }

    const allUsers = [...result.data.present, ...result.data.absent]

    const filtered = debouncedQuery.trim()
        ? allUsers.filter((u) => u.name.toLowerCase().includes(debouncedQuery.toLowerCase()))
        : allUsers

    return (
        <div className="flex flex-col gap-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder={translations.search}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-9"
                />
            </div>

            <div className="flex items-center justify-center gap-4 flex-wrap">
                {Object.entries(statusConfig).map(([status, config]) => (
                    <div key={status} className="flex items-center gap-1.5">
                        <div className={`h-3 w-3 rounded-full ${config.bg}`} />
                        <span className="text-xs text-muted-foreground">
                            {statusLabel(status, translations)}
                        </span>
                    </div>
                ))}
            </div>

            <p className="text-xs text-muted-foreground text-center">
                {translations.showing
                    .replace("[[filtered]]", String(filtered.length))
                    .replace("[[total]]", String(allUsers.length))}
            </p>

            {filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                    {translations.noData}
                </p>
            ) : (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filtered.map((user) => (
                        <UserCard key={user.name} user={user} translations={translations} />
                    ))}
                </div>
            )}
        </div>
    )
}
