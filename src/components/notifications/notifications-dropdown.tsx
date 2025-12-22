"use client"

import { useState } from "react"
import { Bell } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import type { NotificationData } from "@/app/(protected)/actions/notification-actions"

interface NotificationsDropdownProps {
    notifications: NotificationData
    translations: {
        title: string
        noNotifications: string
        viewAll: string
        sections: {
            notifications: string
            pendingRequests: string
        }
        requestTypes: {
            VACATION: string
            SICK_LEAVE: string
            WORK_FROM_HOME: string
            OTHER: string
        }
    }
}

function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    })
}

export function NotificationsDropdown({ notifications, translations }: NotificationsDropdownProps) {
    const { count, pendingRequests } = notifications
    const [activeTab, setActiveTab] = useState<"notifications" | "pending">("notifications")

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {count > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                            {count > 9 ? "9+" : count}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96 p-0">
                <div className="px-4 py-3 border-b">
                    <h3 className="font-semibold text-lg">{translations.title}</h3>
                </div>

                <div className="flex border-b">
                    <button
                        onClick={() => setActiveTab("notifications")}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                            activeTab === "notifications"
                                ? "border-b-2 border-primary text-primary"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        {translations.sections.notifications}
                    </button>
                    <button
                        onClick={() => setActiveTab("pending")}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
                            activeTab === "pending"
                                ? "border-b-2 border-primary text-primary"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        {translations.sections.pendingRequests}
                        {count > 0 && (
                            <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-xs">
                                {count}
                            </Badge>
                        )}
                    </button>
                </div>

                <ScrollArea className="h-[400px]">
                    {activeTab === "notifications" ? (
                        <div className="p-4">
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Bell className="h-12 w-12 text-muted-foreground/50 mb-3" />
                                <p className="text-sm text-muted-foreground">
                                    {translations.noNotifications}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="py-2">
                            {pendingRequests.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                                    <Bell className="h-12 w-12 text-muted-foreground/50 mb-3" />
                                    <p className="text-sm text-muted-foreground">
                                        No pending requests
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {pendingRequests.map((request, index) => (
                                        <div key={request.id}>
                                            <Link
                                                href="/admin/pending-requests"
                                                className="block px-4 py-3 hover:bg-accent transition-colors"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <span className="text-sm font-semibold text-primary">
                                                            {request.userName
                                                                .split(" ")
                                                                .map((n) => n[0])
                                                                .join("")
                                                                .toUpperCase()
                                                                .slice(0, 2)}
                                                        </span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-2 mb-1">
                                                            <span className="font-medium text-sm truncate">
                                                                {request.userName}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground flex-shrink-0">
                                                                {formatDate(request.createdAt)}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground mb-1">
                                                            {translations.requestTypes[
                                                                request.type as keyof typeof translations.requestTypes
                                                            ] || request.type}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {formatDate(request.startDate)} -{" "}
                                                            {formatDate(request.endDate)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </Link>
                                            {index < pendingRequests.length - 1 && <Separator />}
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    )}
                </ScrollArea>

                {activeTab === "pending" && count > 0 && (
                    <>
                        <Separator />
                        <div className="p-3 bg-muted/50">
                            <Link
                                href="/admin/pending-requests"
                                className="block text-center text-sm font-medium text-primary hover:underline"
                            >
                                {translations.viewAll} ({count})
                            </Link>
                        </div>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
