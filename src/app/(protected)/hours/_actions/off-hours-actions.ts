"use server"

import { revalidatePath } from "next/cache"
import { fromZonedTime } from "date-fns-tz"
import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { APP_TIMEZONE } from "@/lib/utils"
import { parseDate } from "@/lib/date-utils"
import { refreshDailyHourSummaryInTransaction } from "@/lib/materialized-views"
import { revalidateTimerPaths } from "@/lib/timer-utils"
import { WORK_HOUR_TYPES } from "@/lib/hour-types"
import { validateInput } from "@/lib/validation"
import {
    OffHoursRangeSchema,
    ReclassifyOffHoursSchema,
    UndoOffHoursSchema,
    type OffHoursManualEntry,
    type OffHoursPreview,
    type OffHoursPreviewResult,
    type OffHoursApplyResult,
    type OffHoursTrackedSegment,
    type OffHoursRangeInput,
    type ReclassifyOffHoursInput,
    type UndoOffHoursInput,
} from "../_schemas/off-hours-schemas"

interface OffHoursWindowRange {
    start: Date
    end: Date
}

async function getUserTimeZone(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { timeZone: true },
    })

    return user?.timeZone || APP_TIMEZONE
}

function buildWindowRange(
    date: string,
    from: string,
    to: string,
    timeZone: string
): OffHoursWindowRange {
    const [year, month, day] = date.split("-").map(Number)
    const [fromHour, fromMinute] = from.split(":").map(Number)
    const [toHour, toMinute] = to.split(":").map(Number)

    const sameDayEnd = toHour * 60 + toMinute > fromHour * 60 + fromMinute

    return {
        start: fromZonedTime(new Date(year, month - 1, day, fromHour, fromMinute, 0, 0), timeZone),
        end: fromZonedTime(
            new Date(year, month - 1, sameDayEnd ? day : day + 1, toHour, toMinute, 0, 0),
            timeZone
        ),
    }
}

function getOverlapSeconds(start: Date, end: Date, range: OffHoursWindowRange): number {
    const overlapStart = Math.max(start.getTime(), range.start.getTime())
    const overlapEnd = Math.min(end.getTime(), range.end.getTime())

    return overlapStart >= overlapEnd ? 0 : Math.round((overlapEnd - overlapStart) / 1000)
}

async function loadTrackedEntries(userId: string, range: OffHoursWindowRange) {
    return prisma.taskTimeEntry.findMany({
        where: {
            userId,
            type: { in: WORK_HOUR_TYPES },
            endTime: { not: null, gt: range.start },
            startTime: { lt: range.end },
        },
        include: {
            task: { select: { id: true, title: true } },
        },
        orderBy: { startTime: "asc" },
    })
}

async function loadManualEntries(userId: string, date: string) {
    return prisma.hourEntry.findMany({
        where: {
            userId,
            date: parseDate(date),
            taskId: null,
            type: { in: WORK_HOUR_TYPES },
        },
        orderBy: { createdAt: "asc" },
    })
}

export async function getOffHoursPreview(
    input: OffHoursRangeInput
): Promise<OffHoursPreviewResult> {
    try {
        const session = await requireAuth()
        const validation = validateInput(OffHoursRangeSchema, input)

        if (!validation.success) {
            return { error: validation.error }
        }

        const { date, from, to, includeManual } = validation.data
        const timeZone = await getUserTimeZone(session.user.id)
        const range = buildWindowRange(date, from, to, timeZone)

        const [entries, activeTimer, manualEntries] = await Promise.all([
            loadTrackedEntries(session.user.id, range),
            prisma.taskTimeEntry.findFirst({
                where: { userId: session.user.id, endTime: null },
                select: { id: true },
            }),
            includeManual ? loadManualEntries(session.user.id, date) : Promise.resolve([]),
        ])

        const tracked: OffHoursTrackedSegment[] = entries.flatMap((entry) => {
            if (!entry.endTime) {
                return []
            }

            const insideSeconds = getOverlapSeconds(entry.startTime, entry.endTime, range)

            if (insideSeconds === 0) {
                return []
            }

            const durationSeconds = Math.round(
                (entry.endTime.getTime() - entry.startTime.getTime()) / 1000
            )

            return [
                {
                    id: entry.id,
                    taskId: entry.taskId,
                    taskTitle: entry.task.title,
                    startTime: entry.startTime,
                    endTime: entry.endTime,
                    durationSeconds,
                    type: entry.type,
                    action: insideSeconds >= durationSeconds ? "convert" : "split",
                    insideSeconds,
                },
            ]
        })

        const manual: OffHoursManualEntry[] = manualEntries.map((entry) => ({
            id: entry.id,
            type: entry.type,
            hours: entry.hours,
            description: entry.description,
        }))

        const preview: OffHoursPreview = {
            windowStart: range.start,
            windowEnd: range.end,
            tracked,
            manual,
            totals: {
                trackedWorkSeconds: tracked.reduce((sum, item) => sum + item.durationSeconds, 0),
                convertedSeconds: tracked.reduce((sum, item) => sum + item.insideSeconds, 0),
            },
            activeTimer: Boolean(activeTimer),
        }

        return { data: preview }
    } catch (error) {
        if (error instanceof Error) {
            return { error: error.message }
        }
        return { error: "Failed to preview off-hours reclassification" }
    }
}

export async function reclassifyOffHours(
    input: ReclassifyOffHoursInput
): Promise<OffHoursApplyResult> {
    try {
        const session = await requireAuth()
        const validation = validateInput(ReclassifyOffHoursSchema, input)

        if (!validation.success) {
            return { error: validation.error }
        }

        const { date, from, to, includeManual, applyToFuture } = validation.data
        const timeZone = await getUserTimeZone(session.user.id)
        const range = buildWindowRange(date, from, to, timeZone)

        const activeTimer = await prisma.taskTimeEntry.findFirst({
            where: { userId: session.user.id, endTime: null },
            select: { id: true },
        })

        if (activeTimer) {
            return { error: "Stop the running timer before reclassifying hours" }
        }

        const entries = await loadTrackedEntries(session.user.id, range)

        const result = await prisma.$transaction(async (tx) => {
            const offHoursWindow = await tx.offHoursWindow.create({
                data: {
                    userId: session.user.id,
                    date: parseDate(date),
                    startDateTime: range.start,
                    endDateTime: range.end,
                    type: "OFF_HOURS",
                    appliesToFuture: applyToFuture,
                },
            })

            let updated = 0
            let created = 0
            let movedSeconds = 0

            for (const entry of entries) {
                if (!entry.endTime) {
                    continue
                }

                const entryStart = entry.startTime.getTime()
                const entryEnd = entry.endTime.getTime()
                const overlapStart = Math.max(entryStart, range.start.getTime())
                const overlapEnd = Math.min(entryEnd, range.end.getTime())

                if (overlapStart >= overlapEnd) {
                    continue
                }

                const insideSeconds = Math.round((overlapEnd - overlapStart) / 1000)
                movedSeconds += insideSeconds

                const startsInsideWindow = overlapStart > entryStart
                const endsInsideWindow = overlapEnd < entryEnd

                if (!startsInsideWindow && !endsInsideWindow) {
                    await tx.taskTimeEntry.update({
                        where: { id: entry.id },
                        data: { type: "OFF_HOURS", offHoursWindowId: offHoursWindow.id },
                    })
                    updated += 1
                    continue
                }

                if (!startsInsideWindow) {
                    await tx.taskTimeEntry.update({
                        where: { id: entry.id },
                        data: {
                            endTime: new Date(overlapEnd),
                            duration: insideSeconds,
                            type: "OFF_HOURS",
                            offHoursWindowId: offHoursWindow.id,
                        },
                    })
                    updated += 1

                    await tx.taskTimeEntry.create({
                        data: {
                            taskId: entry.taskId,
                            userId: session.user.id,
                            startTime: new Date(overlapEnd),
                            endTime: entry.endTime,
                            duration: Math.round((entryEnd - overlapEnd) / 1000),
                            type: entry.type,
                        },
                    })
                    created += 1
                    continue
                }

                await tx.taskTimeEntry.update({
                    where: { id: entry.id },
                    data: {
                        endTime: new Date(overlapStart),
                        duration: Math.round((overlapStart - entryStart) / 1000),
                        offHoursWindowId: offHoursWindow.id,
                    },
                })
                updated += 1

                await tx.taskTimeEntry.create({
                    data: {
                        taskId: entry.taskId,
                        userId: session.user.id,
                        startTime: new Date(overlapStart),
                        endTime: new Date(overlapEnd),
                        duration: insideSeconds,
                        type: "OFF_HOURS",
                        offHoursWindowId: offHoursWindow.id,
                    },
                })
                created += 1

                if (endsInsideWindow) {
                    await tx.taskTimeEntry.create({
                        data: {
                            taskId: entry.taskId,
                            userId: session.user.id,
                            startTime: new Date(overlapEnd),
                            endTime: entry.endTime,
                            duration: Math.round((entryEnd - overlapEnd) / 1000),
                            type: entry.type,
                        },
                    })
                    created += 1
                }
            }

            if (includeManual) {
                const manualEntries = await tx.hourEntry.findMany({
                    where: {
                        userId: session.user.id,
                        date: parseDate(date),
                        taskId: null,
                        type: { in: WORK_HOUR_TYPES },
                    },
                })

                for (const entry of manualEntries) {
                    const existing = await tx.hourEntry.findFirst({
                        where: {
                            userId: session.user.id,
                            date: entry.date,
                            taskId: null,
                            type: "OFF_HOURS",
                        },
                    })

                    if (existing) {
                        await tx.hourEntry.update({
                            where: { id: existing.id },
                            data: {
                                hours: existing.hours + entry.hours,
                                offHoursWindowId: offHoursWindow.id,
                            },
                        })
                        await tx.hourEntry.delete({ where: { id: entry.id } })
                    } else {
                        await tx.hourEntry.update({
                            where: { id: entry.id },
                            data: {
                                type: "OFF_HOURS",
                                offHoursWindowId: offHoursWindow.id,
                            },
                        })
                    }

                    updated += 1
                    movedSeconds += Math.round(entry.hours * 3600)
                }
            }

            await refreshDailyHourSummaryInTransaction(tx)

            return {
                updated,
                created,
                hoursMoved: movedSeconds / 3600,
                windowId: offHoursWindow.id,
            }
        })

        await revalidateTimerPaths()
        revalidatePath("/yearly-calendar")

        return { data: result }
    } catch (error) {
        if (error instanceof Error) {
            return { error: error.message }
        }
        return { error: "Failed to reclassify off-hours" }
    }
}

export async function undoOffHours(
    input: UndoOffHoursInput
): Promise<{ success: true } | { error: string }> {
    try {
        const session = await requireAuth()
        const validation = validateInput(UndoOffHoursSchema, input)

        if (!validation.success) {
            return { error: validation.error }
        }

        const window = await prisma.offHoursWindow.findUnique({
            where: { id: validation.data.windowId },
        })

        if (!window || window.userId !== session.user.id) {
            return { error: "Off-hours window not found" }
        }

        await prisma.$transaction(async (tx) => {
            await tx.taskTimeEntry.updateMany({
                where: { offHoursWindowId: window.id, type: "OFF_HOURS" },
                data: { type: "WORK" },
            })

            await tx.hourEntry.updateMany({
                where: { offHoursWindowId: window.id, type: "OFF_HOURS" },
                data: { type: "WORK" },
            })

            const candidates = await tx.taskTimeEntry.findMany({
                where: {
                    userId: session.user.id,
                    endTime: { not: null },
                    startTime: {
                        gte: new Date(window.startDateTime.getTime() - 86400000),
                        lte: new Date(window.endDateTime.getTime() + 86400000),
                    },
                },
                orderBy: [{ taskId: "asc" }, { startTime: "asc" }],
            })

            for (let index = 0; index < candidates.length - 1; index += 1) {
                const current = candidates[index]
                const next = candidates[index + 1]

                if (
                    current.taskId !== next.taskId ||
                    current.type !== next.type ||
                    !current.endTime ||
                    current.endTime.getTime() !== next.startTime.getTime() ||
                    (current.offHoursWindowId !== window.id && next.offHoursWindowId !== window.id)
                ) {
                    continue
                }

                await tx.taskTimeEntry.update({
                    where: { id: current.id },
                    data: {
                        endTime: next.endTime,
                        duration: (current.duration ?? 0) + (next.duration ?? 0),
                        offHoursWindowId: null,
                    },
                })

                await tx.taskTimeEntry.delete({ where: { id: next.id } })

                current.endTime = next.endTime
                current.duration = (current.duration ?? 0) + (next.duration ?? 0)
                current.offHoursWindowId = null

                candidates.splice(index + 1, 1)
                index -= 1
            }

            await tx.taskTimeEntry.updateMany({
                where: { offHoursWindowId: window.id },
                data: { offHoursWindowId: null },
            })

            await tx.hourEntry.updateMany({
                where: { offHoursWindowId: window.id },
                data: { offHoursWindowId: null },
            })

            await tx.offHoursWindow.delete({ where: { id: window.id } })

            await refreshDailyHourSummaryInTransaction(tx)
        })

        await revalidateTimerPaths()
        revalidatePath("/yearly-calendar")

        return { success: true }
    } catch (error) {
        if (error instanceof Error) {
            return { error: error.message }
        }
        return { error: "Failed to undo off-hours reclassification" }
    }
}
