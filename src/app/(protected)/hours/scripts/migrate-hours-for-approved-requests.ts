import { prisma } from "@/lib/prisma"
import { mapRequestTypeToShiftLocation, mapShiftLocationToHourType, isWeekday } from "@/app/(protected)/shifts/utils/request-shift-mapping"
import { recalculateDailySummaryStandalone } from "../utils/summary-helpers"

async function migrateHoursForApprovedRequests() {
    console.log("Starting migration of hours for approved requests...")

    const approvedRequests = await prisma.request.findMany({
        where: {
            status: "APPROVED",
            affectsHourType: true,
            type: {
                notIn: ["VACATION", "SICK_LEAVE"],
            },
        },
        orderBy: {
            startDate: "asc",
        },
    })

    console.log(`Found ${approvedRequests.length} approved requests that affect hour types`)

    for (const request of approvedRequests) {
        console.log(`\nProcessing request ${request.id} (${request.type}) for user ${request.userId}`)
        console.log(`Date range: ${request.startDate.toISOString().split("T")[0]} to ${request.endDate.toISOString().split("T")[0]}`)

        const shiftLocation = mapRequestTypeToShiftLocation(request.type)
        const targetHourType = mapShiftLocationToHourType(shiftLocation)

        console.log(`Target hour type: ${targetHourType}`)

        const holidays = await prisma.holiday.findMany({
            where: {
                date: {
                    gte: request.startDate,
                    lte: request.endDate,
                },
            },
        })

        const migrateDate = new Date(request.startDate)
        const migrateEndDate = new Date(request.endDate)
        let migratedCount = 0
        const affectedDates: Date[] = []

        while (migrateDate <= migrateEndDate) {
            const isHol = holidays.some((h) => {
                const holidayDate = new Date(h.date)
                holidayDate.setHours(0, 0, 0, 0)
                const checkDate = new Date(migrateDate)
                checkDate.setHours(0, 0, 0, 0)
                return holidayDate.getTime() === checkDate.getTime()
            })

            if (isWeekday(migrateDate) && !isHol) {
                const normalizedDate = new Date(migrateDate)
                normalizedDate.setHours(0, 0, 0, 0)

                const dayStart = new Date(normalizedDate)
                const dayEnd = new Date(normalizedDate)
                dayEnd.setHours(23, 59, 59, 999)

                const workEntries = await prisma.hourEntry.findMany({
                    where: {
                        userId: request.userId,
                        date: {
                            gte: dayStart,
                            lte: dayEnd,
                        },
                        type: "WORK",
                        taskId: null,
                    },
                })

                for (const entry of workEntries) {
                    await prisma.hourEntry.update({
                        where: { id: entry.id },
                        data: {
                            type: targetHourType,
                            description: entry.description
                                ? `${entry.description} (migrated from WORK)`
                                : `Migrated from WORK due to ${request.type.toLowerCase()} request`,
                        },
                    })
                    migratedCount++
                }

                if (workEntries.length > 0) {
                    affectedDates.push(new Date(normalizedDate))
                }
            }

            migrateDate.setDate(migrateDate.getDate() + 1)
        }

        console.log(`Migrated ${migratedCount} hour entries`)

        if (affectedDates.length > 0) {
            console.log(`Recalculating summaries for ${affectedDates.length} dates...`)
            
            for (const date of affectedDates) {
                await recalculateDailySummaryStandalone(request.userId, date, "WORK")
                await recalculateDailySummaryStandalone(request.userId, date, targetHourType)
            }
        }

        console.log(`✓ Completed request ${request.id}`)
    }

    console.log("\n✓ Migration complete!")
}

migrateHoursForApprovedRequests()
    .then(() => {
        console.log("Done!")
        process.exit(0)
    })
    .catch((error) => {
        console.error("Error during migration:", error)
        process.exit(1)
    })
