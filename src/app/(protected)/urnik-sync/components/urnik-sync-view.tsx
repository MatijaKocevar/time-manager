"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface UrnikRequest {
    no: string
    requestDate: string
    requestType: string
    period: string
    days: string
    hours: string
    pPrihod: string
    arrival: string
    arrivalRequests: string
    pOdhod: string
    departure: string
    departureRequests: string
    oldSchedule: string
    newSchedule: string
    status: string
    confirmedBy: string
    notes: string
    hasActions: boolean
}

interface User {
    id: string
    name: string | null
    email: string
    role: string
    isDemo: boolean
    urnikUsername: string | null
    lastUrnikTestAt: Date | null
}

interface UrnikSyncViewProps {
    user: User
    translations: {
        pageTitle: string
        noCredentials: string
        goToProfile: string
        connectionStatus: string
        connected: string
        notConnected: string
        lastTested: string
    }
    loginResult: { success: boolean; error?: string } | null
    requestsResult: {
        success: boolean
        data?: UrnikRequest[]
        error?: string
        structureChanged?: boolean
    } | null
}

export function UrnikSyncView({
    user,
    translations: t,
    requestsResult,
}: UrnikSyncViewProps) {
    const hasCredentials = !!user.urnikUsername
    const isConnected = !!user.lastUrnikTestAt
    const lastTestedText = user.lastUrnikTestAt
        ? new Date(user.lastUrnikTestAt).toLocaleString()
        : null

    const requests = requestsResult?.data || null
    const error = requestsResult?.error || null
    const structureChanged = requestsResult?.structureChanged || false

    if (!hasCredentials) {
        return (
            <div className="space-y-4">
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-muted-foreground mb-4">{t.noCredentials}</p>
                        <Button asChild>
                            <Link href="/profile">{t.goToProfile}</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4 h-full">
            <div className="flex items-center justify-end gap-2">
                <span className="text-sm text-muted-foreground">{t.connectionStatus}:</span>
                <Badge variant={isConnected ? "default" : "destructive"}>
                    {isConnected ? t.connected : t.notConnected}
                </Badge>
                {lastTestedText && (
                    <span className="text-sm text-muted-foreground">
                        ({t.lastTested}: {lastTestedText})
                    </span>
                )}
            </div>

            {structureChanged && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>HTML Structure Changed</AlertTitle>
                    <AlertDescription>
                        The urnik.net page structure has changed. The parser needs to be updated to
                        match the new format. Please contact the developer.
                    </AlertDescription>
                </Alert>
            )}

            {error && !structureChanged && <p className="text-red-600">Error: {error}</p>}

            {requests && requests.length > 0 && (
                <div className="flex-1 overflow-hidden">
                    <div className="rounded-md border overflow-auto h-full">
                    <Table>
                        <TableHeader className="sticky top-0 z-30 bg-background">
                            <TableRow>
                                <TableHead className="min-w-[60px]">No.</TableHead>
                                <TableHead className="min-w-[120px]">Request date</TableHead>
                                <TableHead className="min-w-[180px]">Request type</TableHead>
                                <TableHead className="min-w-[120px]">Period</TableHead>
                                <TableHead className="text-right min-w-[80px]">Days</TableHead>
                                <TableHead className="text-right min-w-[80px]">Hours</TableHead>
                                <TableHead className="min-w-[100px]">Arrival</TableHead>
                                <TableHead className="min-w-[100px]">Departure</TableHead>
                                <TableHead className="text-center min-w-[120px]">Status</TableHead>
                                <TableHead className="min-w-[150px]">Confirmed by</TableHead>
                                <TableHead className="min-w-[200px]">Notes</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests.map((req) => (
                                <TableRow key={req.no}>
                                    <TableCell>{req.no}</TableCell>
                                    <TableCell>{req.requestDate}</TableCell>
                                    <TableCell>{req.requestType}</TableCell>
                                    <TableCell>{req.period}</TableCell>
                                    <TableCell className="text-right">{req.days}</TableCell>
                                    <TableCell className="text-right">{req.hours}</TableCell>
                                    <TableCell>{req.arrivalRequests}</TableCell>
                                    <TableCell>{req.departureRequests}</TableCell>
                                    <TableCell className="text-center">
                                        <span
                                            className={
                                                req.status.includes("Confirmed")
                                                    ? "text-green-600"
                                                    : req.status.includes("Rejected")
                                                      ? "text-red-600"
                                                      : "text-muted-foreground"
                                            }
                                        >
                                            {req.status}
                                        </span>
                                    </TableCell>
                                    <TableCell>{req.confirmedBy}</TableCell>
                                    <TableCell>{req.notes}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    </div>
                </div>
            )}
        </div>
    )
}
