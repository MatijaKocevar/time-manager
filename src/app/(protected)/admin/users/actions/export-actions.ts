"use server"

import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import ExcelJS from "exceljs"
import {
    generateCSV,
    generateExcel,
    generateMultiSheetExcel,
    generateJSON,
    type UserExportData,
    type ExportMetadata,
    type MonthlyHourExportData,
} from "@/features/export"
import { ExportOptionsSchema, type ExportOptions, type ExportFormat } from "@/features/export"
import { fetchMonthlyHourData } from "@/app/(protected)/hours/actions/export-actions"

async function requireAdmin() {
    const session = await getServerSession(authConfig)
    if (!session?.user || session.user.role !== "ADMIN") {
        throw new Error("Unauthorized - Admin access required")
    }
    return session
}

export async function exportUsersData(input: { format: ExportFormat }) {
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

        let result: string | Uint8Array

        if (input.format === "csv") {
            const headers = ["ID", "Name", "Email", "Role", "Created At"]
            const rows = data.map((u) => [u.id, u.name, u.email, u.role, u.createdAt])
            result = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
        } else if (input.format === "excel") {
            const workbook = new ExcelJS.Workbook()
            const worksheet = workbook.addWorksheet("Users")

            worksheet.columns = [
                { header: "ID", key: "id", width: 30 },
                { header: "Name", key: "name", width: 20 },
                { header: "Email", key: "email", width: 30 },
                { header: "Role", key: "role", width: 15 },
                { header: "Created At", key: "createdAt", width: 20 },
            ]

            worksheet.addRows(data)
            const buffer = await workbook.xlsx.writeBuffer()
            result = Buffer.from(buffer)
        } else {
            result = JSON.stringify({ ...metadata, users: data }, null, 2)
        }

        return {
            success: true,
            data:
                input.format === "excel"
                    ? Buffer.from(result as Uint8Array).toString("base64")
                    : result,
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

        const { format, months, userId } = validation.data

        if (!userId) {
            return { error: "User ID is required" }
        }

        const monthlyData: MonthlyHourExportData[] = []
        for (const month of months) {
            const data = await fetchMonthlyHourData(userId, month)
            monthlyData.push(data)
        }

        if (monthlyData.length === 0) {
            return { error: "No data found for selected months" }
        }

        const metadata: ExportMetadata = {
            exportDate: new Date().toISOString(),
            dateRange: {
                start: monthlyData[0].monthKey,
                end: monthlyData[monthlyData.length - 1].monthKey,
            },
            generatedBy: session.user.email || undefined,
            format,
        }

        let result: string | Buffer

        if (format === "csv") {
            result = generateCSV(monthlyData)
        } else if (format === "excel") {
            result =
                monthlyData.length > 1
                    ? await generateMultiSheetExcel(monthlyData)
                    : await generateExcel(monthlyData[0])
        } else {
            result = generateJSON(monthlyData, metadata)
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
