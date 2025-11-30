import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authConfig)
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const searchParams = request.nextUrl.searchParams
        const startDate = searchParams.get("startDate")
        const endDate = searchParams.get("endDate")
        const type = searchParams.get("type")

        const parseDate = (dateStr: string) => {
            const [year, month, day] = dateStr.split("-").map(Number)
            return new Date(year, month - 1, day)
        }

        const entries = await prisma.hourEntry.findMany({
            where: {
                userId: session.user.id,
                ...(startDate && endDate
                    ? {
                          date: {
                              gte: parseDate(startDate),
                              lte: parseDate(endDate),
                          },
                      }
                    : {}),
                ...(type
                    ? {
                          type: type as
                              | "WORK"
                              | "VACATION"
                              | "SICK_LEAVE"
                              | "WORK_FROM_HOME"
                              | "OTHER",
                      }
                    : {}),
            },
            orderBy: {
                date: "desc",
            },
        })

        return NextResponse.json(entries)
    } catch (error) {
        console.error("Error fetching hour entries:", error)
        return NextResponse.json({ error: "Failed to fetch entries" }, { status: 500 })
    }
}
