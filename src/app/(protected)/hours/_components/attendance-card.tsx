"use client"

import { useTranslations } from "next-intl"
import { Card, CardHeader } from "@/components/ui/card"
import { HOUR_TYPE_COLORS } from "../_constants/hour-types"

interface AttendanceCardProps {
    officeCount: number
    remoteCount: number
}

export function AttendanceCard({ officeCount, remoteCount }: AttendanceCardProps) {
    const t = useTranslations("hours.summary")

    return (
        <Card>
            <CardHeader className="p-2">
                <div
                    className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${HOUR_TYPE_COLORS.WORK}`}
                >
                    {t("attendance")}
                </div>
                <div className="mt-1 space-y-1 text-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">{t("inOffice")}:</span>
                        <span className="font-semibold">{officeCount}x</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">{t("workFromHome")}:</span>
                        <span className="font-semibold">{remoteCount}x</span>
                    </div>
                </div>
            </CardHeader>
        </Card>
    )
}
