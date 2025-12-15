import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { authConfig } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getUsers } from "./users/actions/user-actions"
import { getAllRequests } from "../../requests/actions/request-actions"
import { getHolidays } from "./holidays/actions/holiday-actions"
import { Users, ClockAlert, History, CalendarX2, ArrowRight } from "lucide-react"

export default async function AdminOverviewPage() {
    const session = await getServerSession(authConfig)

    if (!session?.user || session.user.role !== "ADMIN") {
        redirect("/")
    }

    const [users, pendingRequests, allRequests, holidaysResult] = await Promise.all([
        getUsers(),
        getAllRequests(["PENDING"]),
        getAllRequests(),
        getHolidays(),
    ])

    const holidays = (holidaysResult.success ? holidaysResult.data : []) ?? []
    const approvedRequests = allRequests.filter((r) => r.status === "APPROVED")
    const rejectedRequests = allRequests.filter((r) => r.status === "REJECTED")
    const cancelledRequests = allRequests.filter((r) => r.status === "CANCELLED")

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const upcomingHolidays = holidays.filter((h) => new Date(h.date) >= today)

    const stats = [
        {
            title: "Total Users",
            value: users.length,
            description: "Registered in the system",
            icon: Users,
            href: "/admin/users",
            color: "text-blue-600",
        },
        {
            title: "Pending Requests",
            value: pendingRequests.length,
            description: "Awaiting approval",
            icon: ClockAlert,
            href: "/admin/pending-requests",
            color: "text-orange-600",
        },
        {
            title: "Total Requests",
            value: allRequests.length,
            description: "All time requests",
            icon: History,
            href: "/admin/request-history",
            color: "text-purple-600",
        },
        {
            title: "Upcoming Holidays",
            value: upcomingHolidays.length,
            description: "Scheduled holidays",
            icon: CalendarX2,
            href: "/admin/holidays",
            color: "text-green-600",
        },
    ]

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold">Admin Overview</h1>
                <p className="text-muted-foreground mt-1">
                    Manage users, requests, and system settings
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => {
                    const Icon = stat.icon
                    return (
                        <Link key={stat.title} href={stat.href}>
                            <Card className="hover:shadow-md transition-shadow cursor-pointer">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        {stat.title}
                                    </CardTitle>
                                    <Icon className={`h-4 w-4 ${stat.color}`} />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stat.value}</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {stat.description}
                                    </p>
                                </CardContent>
                            </Card>
                        </Link>
                    )
                })}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Request Status Breakdown</CardTitle>
                        <CardDescription>Overview of all request statuses</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                <span className="text-sm">Pending</span>
                            </div>
                            <span className="font-semibold">{pendingRequests.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                                <span className="text-sm">Approved</span>
                            </div>
                            <span className="font-semibold">{approvedRequests.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <span className="text-sm">Rejected</span>
                            </div>
                            <span className="font-semibold">{rejectedRequests.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-gray-500" />
                                <span className="text-sm">Cancelled</span>
                            </div>
                            <span className="font-semibold">{cancelledRequests.length}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>Common administrative tasks</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Link href="/admin/users">
                            <Button variant="outline" className="w-full justify-between">
                                <span>Manage Users</span>
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                        <Link href="/admin/pending-requests">
                            <Button variant="outline" className="w-full justify-between">
                                <span>Review Pending Requests</span>
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                        <Link href="/admin/holidays">
                            <Button variant="outline" className="w-full justify-between">
                                <span>Manage Holidays</span>
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                        <Link href="/admin/request-history">
                            <Button variant="outline" className="w-full justify-between">
                                <span>View Request History</span>
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>

            {pendingRequests.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Pending Requests</CardTitle>
                        <CardDescription>Latest requests awaiting your approval</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {pendingRequests.slice(0, 5).map((request) => (
                                <div
                                    key={request.id}
                                    className="flex items-center justify-between p-3 rounded-lg border"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium">
                                            {request.user?.name || request.user?.email}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {request.type} •{" "}
                                            {new Date(request.startDate).toLocaleDateString()} -{" "}
                                            {new Date(request.endDate).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <Link href="/admin/pending-requests">
                                        <Button size="sm" variant="outline">
                                            Review
                                        </Button>
                                    </Link>
                                </div>
                            ))}
                            {pendingRequests.length > 5 && (
                                <Link href="/admin/pending-requests">
                                    <Button variant="link" className="w-full">
                                        View all {pendingRequests.length} pending requests
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {upcomingHolidays.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Upcoming Holidays</CardTitle>
                        <CardDescription>Next scheduled holidays</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {upcomingHolidays.slice(0, 5).map((holiday) => (
                                <div
                                    key={holiday.id}
                                    className="flex items-center justify-between p-3 rounded-lg border"
                                >
                                    <div>
                                        <div className="font-medium">{holiday.name}</div>
                                        <div className="text-sm text-muted-foreground">
                                            {new Date(holiday.date).toLocaleDateString("en-US", {
                                                weekday: "long",
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {upcomingHolidays.length > 5 && (
                                <Link href="/admin/holidays">
                                    <Button variant="link" className="w-full">
                                        View all {upcomingHolidays.length} upcoming holidays
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
