"use server"

import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
    generateCSV,
    generateExcel,
    generateJSON,
    type UserExportData,
    type ExportMetadata,
} from "@/features/export"
import { ExportOptionsSchema, type ExportOptions } from "@/features/export"

async function requireAdmin() {
    const session = await getServerSession(authConfig)
    if (!session?.user || session.user.role !== "ADMIN") {
        throw new Error("Unauthorized - Admin access required")
    }
    return session
}

export async function exportUsersData(input: Omit<ExportOptions, "startDate" | "endDate">) {
    try {
        const session = await requireAdmin()

        const users = await prisma.user.findMany({
            orderBy: {
                createdAt: "desc",
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
        })

        if (users.length === 0) {
            return { error: "No users found" }
        }

        const data: UserExportData[] = users.map((user) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt.toISOString(),
        }))

        const metadata: ExportMetadata = {
            exportDate: new Date().toISOString(),
            dateRange: { start: "", end: "" },
            generatedBy: session.user.email || undefined,
            format: input.format,
        }

        let result: string | Buffer

        if (input.format === "csv") {
            result = generateCSV(data)
        } else if (input.format === "excel") {
            const columns = [
                { header: "ID", key: "id", width: 30 },
                { header: "Name", key: "name", width: 20 },
                { header: "Email", key: "email", width: 30 },
                { header: "Role", key: "role", width: 15 },
                { header: "Created At", key: "createdAt", width: 20 },
            ]

            result = await generateExcel(data, {
                sheetName: "Users",
                columns,
                title: "Users Report",
                includeFormulas: false,
            })
        } else {
            result = generateJSON(data, metadata)
        }

        return {
            success: true,
            data: input.format === "excel" ? result.toString("base64") : result,
        }
    } catch (error) {
        if (error instanceof Error) {
            return { error: error.message }
        }
        return { error: "Failed to export users data" }
    }
}

export async function exportUserDetailsWithHours(input: ExportOptions) {
    try {
        const session = await requireAdmin()

        const validation = ExportOptionsSchema.safeParse(input)
        if (!validation.success) {
            return { error: validation.error.issues[0].message }
        }

        const { format, startDate, endDate, userId } = validation.data

        if (!userId) {
            return { error: "User ID is required" }
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
        })

        if (!user) {
            return { error: "User not found" }
        }

        const hourEntries = await prisma.hourEntry.findMany({
            where: {
                userId,
                date: {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                },
            },
            orderBy: {
                date: "asc",
            },
            select: {
                date: true,
                hours: true,
                type: true,
                description: true,
            },
        })

        const data = hourEntries.map((entry) => ({
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            date: entry.date.toISOString().split("T")[0],
            hours: entry.hours,
            type: entry.type,
            description: entry.description,
        }))

        const totalHours = hourEntries.reduce((sum, entry) => sum + entry.hours, 0)

        const metadata: ExportMetadata = {
            exportDate: new Date().toISOString(),
            dateRange: { start: startDate, end: endDate },
            generatedBy: session.user.email || undefined,
            format,
        }

        let result: string | Buffer

        if (format === "csv") {
            result = generateCSV(data)
        } else if (format === "excel") {
            const columns = [
                { header: "Date", key: "date", width: 12 },
                { header: "Hours", key: "hours", width: 10 },
                { header: "Type", key: "type", width: 20 },
                { header: "Description", key: "description", width: 30 },
            ]

            result = await generateExcel(data, {
                sheetName: "User Hours",
                columns,
                title: `${user.name || user.email} - Hours Report`,
                includeFormulas: true,
            })
        } else {
            const exportData = {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
                summary: {
                    totalHours,
                    totalEntries: hourEntries.length,
                },
                hourEntries: data,
            }
            result = JSON.stringify({ ...metadata, ...exportData }, null, 2)
        }

        return {
            success: true,
            data: format === "excel" ? result.toString("base64") : result,
        }
    } catch (error) {
        if (error instanceof Error) {
            return { error: error.message }
        }
        return { error: "Failed to export user details" }
    }
}
