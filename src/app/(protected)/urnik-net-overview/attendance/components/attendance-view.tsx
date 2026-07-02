"use client"

import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, AlertTriangle, Users } from "lucide-react"
import type { ParsedAttendanceResult, UserStatus } from "../schemas/attendance-schema"

interface AttendanceViewProps {
    result: ParsedAttendanceResult
    translations: {
        pageTitle: string
        present: string
        absent: string
        unreachable: string
        noData: string
        errorTitle: string
        structureChangedWarning: string
        structureChangedDescription: string
    }
}

function getStatusColor(colorClass: string): string {
    if (colorClass === "BC-0") return "bg-emerald-500"
    return "bg-gray-400"
}

function getStatusVariant(status: UserStatus["status"]): "default" | "secondary" | "outline" {
    switch (status) {
        case "Present":
            return "default"
        case "Unreachable":
            return "secondary"
        case "Absent":
            return "outline"
    }
}

function UserCard({ user }: { user: UserStatus }) {
    return (
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
            <div
                className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${getStatusColor(user.colorClass)}`}
            >
                {user.imageUrl ? (
                    <Image
                        src={user.imageUrl}
                        alt={user.name}
                        width={34}
                        height={34}
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
            </div>
            <Badge variant={getStatusVariant(user.status)} className="shrink-0">
                {user.status}
            </Badge>
        </div>
    )
}

function StatusColumn({
    title,
    users,
    emptyMessage,
}: {
    title: string
    users: UserStatus[]
    emptyMessage: string
}) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {title}
                    <Badge variant="secondary" className="ml-1">
                        {users.length}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {users.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">{emptyMessage}</p>
                ) : (
                    <div className="space-y-2">
                        {users.map((user) => (
                            <UserCard key={user.name} user={user} />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export function AttendanceView({ result, translations }: AttendanceViewProps) {
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

    const { present, absent } = result.data

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <StatusColumn
                title={translations.present}
                users={present}
                emptyMessage={translations.noData}
            />
            <StatusColumn
                title={translations.absent}
                users={absent}
                emptyMessage={translations.noData}
            />
        </div>
    )
}
