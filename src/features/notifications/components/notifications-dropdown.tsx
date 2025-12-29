"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Bell, Check, X, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { WorkTypeBadge } from "@/components/work-type-badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { approveRequest, rejectRequest } from "@/app/(protected)/requests/actions/request-actions"
import { requestKeys } from "@/app/(protected)/requests/query-keys"
import {
    getNotifications,
    markNotificationsAsRead,
    type NotificationData,
} from "../actions/notification-actions"
import type { WorkType } from "@/lib/work-type-styles"

interface NotificationsDropdownProps {
    initialNotifications: NotificationData
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
        approve?: string
        reject?: string
    }
}

function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    })
}

function formatRelativeTime(date: Date): string {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return formatDate(date)
}

export function NotificationsDropdown({
    initialNotifications,
    translations,
}: NotificationsDropdownProps) {
    const [activeTab, setActiveTab] = useState<"notifications" | "pending">("notifications")
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [isOpen, setIsOpen] = useState(false)
    const [visibleNotificationIds, setVisibleNotificationIds] = useState<Set<string>>(new Set())
    const scrollAreaRef = useRef<HTMLDivElement>(null)
    const queryClient = useQueryClient()

    const { data: notifications = initialNotifications, refetch } = useQuery({
        queryKey: ["notifications"],
        queryFn: getNotifications,
        initialData: initialNotifications,
        refetchInterval: 60000,
        refetchIntervalInBackground: true,
    })

    const {
        count,
        pendingRequests,
        notifications: userNotifications,
        unreadCount,
        isAdmin,
    } = notifications

    const totalBadgeCount = unreadCount + count

    useEffect(() => {
        if (isOpen && scrollAreaRef.current && userNotifications.length > 0) {
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        const notifId = entry.target.getAttribute("data-notification-id")
                        if (notifId && entry.isIntersecting) {
                            setVisibleNotificationIds((prev) => new Set(prev).add(notifId))
                        }
                    })
                },
                {
                    root: scrollAreaRef.current,
                    threshold: 0.5,
                }
            )

            const notifElements = scrollAreaRef.current.querySelectorAll("[data-notification-id]")
            notifElements.forEach((el) => observer.observe(el))

            return () => observer.disconnect()
        }
    }, [isOpen, userNotifications])

    const handleDropdownClose = useCallback(async () => {
        if (visibleNotificationIds.size > 0) {
            const unreadVisible = Array.from(visibleNotificationIds).filter((id) => {
                const notif = userNotifications.find((n) => n.id === id)
                return notif && !notif.read
            })

            if (unreadVisible.length > 0) {
                await markNotificationsAsRead(unreadVisible)
                refetch()
            }
        }
        setVisibleNotificationIds(new Set())
        setIsOpen(false)
    }, [visibleNotificationIds, userNotifications, refetch])

    const approveMutation = useMutation({
        mutationFn: approveRequest,
        onMutate: (variables) => {
            setProcessingId(variables.id)
        },
        onSuccess: (data) => {
            if (data.error) {
                alert(`Error: ${data.error}`)
            }
            queryClient.invalidateQueries({ queryKey: requestKeys.all })
            refetch()
        },
        onError: (error) => {
            alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
        },
        onSettled: () => {
            setProcessingId(null)
        },
    })

    const rejectMutation = useMutation({
        mutationFn: rejectRequest,
        onMutate: (variables) => {
            setProcessingId(variables.id)
        },
        onSuccess: (data) => {
            if (data.error) {
                alert(`Error: ${data.error}`)
            }
            queryClient.invalidateQueries({ queryKey: requestKeys.all })
            refetch()
        },
        onError: (error) => {
            alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
        },
        onSettled: () => {
            setProcessingId(null)
        },
    })

    const handleApprove = (e: React.MouseEvent, requestId: string) => {
        e.preventDefault()
        e.stopPropagation()
        approveMutation.mutate({ id: requestId })
    }

    const handleReject = (e: React.MouseEvent, requestId: string) => {
        e.preventDefault()
        e.stopPropagation()
        const reason = prompt("Rejection reason (optional):")
        rejectMutation.mutate({ id: requestId, rejectionReason: reason || "" })
    }

    return (
        <DropdownMenu
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) {
                    handleDropdownClose()
                } else {
                    setIsOpen(true)
                }
            }}
        >
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {totalBadgeCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                            {totalBadgeCount > 9 ? "9+" : totalBadgeCount}
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
                        {unreadCount > 0 && (
                            <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-xs">
                                {unreadCount}
                            </Badge>
                        )}
                    </button>
                    {isAdmin && (
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
                    )}
                </div>

                <ScrollArea className="h-[400px]" ref={scrollAreaRef}>
                    {activeTab === "notifications" ? (
                        <div className="p-4">
                            {userNotifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <Bell className="h-12 w-12 text-muted-foreground/50 mb-3" />
                                    <p className="text-sm text-muted-foreground">
                                        {translations.noNotifications}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {userNotifications.map((notif) => (
                                        <Link
                                            key={notif.id}
                                            href={notif.url || "#"}
                                            data-notification-id={notif.id}
                                            className={`block rounded-lg p-3 transition-colors hover:bg-accent ${
                                                !notif.read ? "bg-blue-50 dark:bg-blue-950/20" : ""
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 space-y-1">
                                                    <p
                                                        className={`text-sm ${!notif.read ? "font-bold" : ""}`}
                                                    >
                                                        {notif.title}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {notif.message}
                                                    </p>
                                                </div>
                                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                    {formatRelativeTime(notif.createdAt)}
                                                </span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
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
                                    {pendingRequests.map((request, index) => {
                                        const isProcessing = processingId === request.id
                                        return (
                                            <div key={request.id}>
                                                <div className="px-4 py-3 hover:bg-accent transition-colors">
                                                    <div className="flex items-start gap-3">
                                                        {isAdmin && (
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
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            {isAdmin && (
                                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                                    <span className="font-medium text-sm truncate">
                                                                        {request.userName}
                                                                    </span>
                                                                    <span className="text-xs text-muted-foreground flex-shrink-0">
                                                                        {formatDate(
                                                                            request.createdAt
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <p className="text-sm mb-1">
                                                                <WorkTypeBadge
                                                                    type={request.type as WorkType}
                                                                >
                                                                    {translations.requestTypes[
                                                                        request.type as keyof typeof translations.requestTypes
                                                                    ] || request.type}
                                                                </WorkTypeBadge>
                                                            </p>
                                                            <p className="text-xs text-muted-foreground mb-2">
                                                                {formatDate(request.startDate)} -{" "}
                                                                {formatDate(request.endDate)}
                                                            </p>
                                                            {isAdmin && (
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={(e) =>
                                                                            handleApprove(
                                                                                e,
                                                                                request.id
                                                                            )
                                                                        }
                                                                        disabled={!!processingId}
                                                                        className="h-7 px-3 text-xs"
                                                                    >
                                                                        {isProcessing &&
                                                                        approveMutation.isPending ? (
                                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                                        ) : (
                                                                            <>
                                                                                <Check className="h-3 w-3 mr-1" />
                                                                                {translations.approve ||
                                                                                    "Approve"}
                                                                            </>
                                                                        )}
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="destructive"
                                                                        onClick={(e) =>
                                                                            handleReject(
                                                                                e,
                                                                                request.id
                                                                            )
                                                                        }
                                                                        disabled={!!processingId}
                                                                        className="h-7 px-3 text-xs"
                                                                    >
                                                                        {isProcessing &&
                                                                        rejectMutation.isPending ? (
                                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                                        ) : (
                                                                            <>
                                                                                <X className="h-3 w-3 mr-1" />
                                                                                {translations.reject ||
                                                                                    "Reject"}
                                                                            </>
                                                                        )}
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                {index < pendingRequests.length - 1 && (
                                                    <Separator />
                                                )}
                                            </div>
                                        )
                                    })}
                                </>
                            )}
                        </div>
                    )}
                </ScrollArea>

                {activeTab === "pending" && count > 0 && isAdmin && (
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
