import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { startOfDay, endOfDay } from "@/lib/date-utils"
import type { HourType, RequestType } from "@/../../prisma/generated/client"
import {
    mapRequestTypeToShiftLocation,
    mapRequestTypeToHourType,
} from "@/app/(protected)/shifts/_utils/request-shift-mapping"
import { notifyUserApproval, notifyUserRejection } from "@/features/notifications/lib/notify"
import { refreshDailyHourSummary } from "@/lib/materialized-views"

function combineDateTime(date: Date, timeStr: string): Date {
    const [hours, minutes] = timeStr.split(":").map(Number)
    const combined = new Date(date)
    combined.setHours(hours, minutes, 0, 0)
    return combined
}

function getRequestDateTimeRange(request: {
    startDate: Date
    endDate: Date
    startTime: string | null
    endTime: string | null
    isFullDay: boolean
}) {
    if (request.isFullDay || !request.startTime || !request.endTime) {
        const start = startOfDay(new Date(request.startDate))
        const end = endOfDay(new Date(request.endDate))
        return { startDateTime: start, endDateTime: end }
    }

    const startDateTime = combineDateTime(request.startDate, request.startTime)
    const endDateTime = combineDateTime(request.endDate, request.endTime)
    return { startDateTime, endDateTime }
}

async function findOverlappingRequests(
    tx: Omit<
        typeof prisma,
        "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
    >,
    userId: string,
    startDateTime: Date,
    endDateTime: Date,
    excludeRequestId?: string
) {
    const requests = await tx.request.findMany({
        where: {
            userId,
            status: "APPROVED",
            id: excludeRequestId ? { not: excludeRequestId } : undefined,
        },
    })

    return requests.filter((req) => {
        const reqRange = getRequestDateTimeRange(req)
        return reqRange.startDateTime < endDateTime && reqRange.endDateTime > startDateTime
    })
}

async function cleanupRequestDataInRange(
    tx: Omit<
        typeof prisma,
        "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
    >,
    userId: string,
    startDateTime: Date,
    endDateTime: Date,
    requestType: string
) {
    await tx.shift.deleteMany({
        where: {
            userId,
            date: { gte: startDateTime, lte: endDateTime },
            notes: { contains: "Auto-generated from" },
        },
    })

    if (requestType === "VACATION" || requestType === "SICK_LEAVE") {
        const systemTask = await tx.task.findFirst({
            where: {
                userId,
                title: `System: ${requestType}`,
            },
        })

        if (systemTask) {
            await tx.taskTimeEntry.deleteMany({
                where: {
                    userId,
                    taskId: systemTask.id,
                    startTime: { gte: startDateTime, lte: endDateTime },
                },
            })
        }
    } else {
        const hourType = mapRequestTypeToHourType(requestType as RequestType)

        await tx.hourEntry.updateMany({
            where: {
                userId,
                date: { gte: startDateTime, lte: endDateTime },
                type: hourType,
            },
            data: { type: "WORK" },
        })

        await tx.taskTimeEntry.updateMany({
            where: {
                userId,
                startTime: { gte: startDateTime, lte: endDateTime },
                type: hourType,
            },
            data: { type: "WORK" },
        })
    }
}

async function trimOverlappingRequest(
    tx: Omit<
        typeof prisma,
        "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
    >,
    oldRequest: {
        id: string
        userId: string
        startDate: Date
        endDate: Date
        startTime: string | null
        endTime: string | null
        isFullDay: boolean
        type: RequestType
        requestedHours: unknown
        affectsHourType: boolean
        skipWeekends: boolean
        skipHolidays: boolean
        approvedBy: string | null
    },
    newStartDateTime: Date,
    newEndDateTime: Date,
    newRequestId: string
) {
    const oldRange = getRequestDateTimeRange(oldRequest)

    const fullyOverlapped =
        newStartDateTime <= oldRange.startDateTime && newEndDateTime >= oldRange.endDateTime

    if (fullyOverlapped) {
        await tx.request.update({
            where: { id: oldRequest.id },
            data: {
                status: "CANCELLED",
                cancellationReason: "Superseded by newer request",
                supersededBy: newRequestId,
                originalStartDate: oldRequest.startDate,
                originalEndDate: oldRequest.endDate,
            },
        })
        await cleanupRequestDataInRange(
            tx,
            oldRequest.userId,
            oldRange.startDateTime,
            oldRange.endDateTime,
            oldRequest.type
        )
        return
    }

    const leftTrim =
        oldRange.startDateTime < newStartDateTime &&
        oldRange.endDateTime <= newEndDateTime &&
        oldRange.endDateTime > newStartDateTime

    if (leftTrim) {
        const newEndDate = endOfDay(new Date(newStartDateTime))
        newEndDate.setDate(newEndDate.getDate() - 1)

        await tx.request.update({
            where: { id: oldRequest.id },
            data: {
                endDate: newEndDate,
                trimmedBy: newRequestId,
                originalEndDate: oldRequest.endDate,
            },
        })

        await cleanupRequestDataInRange(
            tx,
            oldRequest.userId,
            newStartDateTime,
            oldRange.endDateTime,
            oldRequest.type
        )
        return
    }

    const rightTrim =
        oldRange.startDateTime >= newStartDateTime &&
        oldRange.startDateTime < newEndDateTime &&
        oldRange.endDateTime > newEndDateTime

    if (rightTrim) {
        const newStartDate = startOfDay(new Date(newEndDateTime))
        newStartDate.setDate(newStartDate.getDate() + 1)

        await tx.request.update({
            where: { id: oldRequest.id },
            data: {
                startDate: newStartDate,
                trimmedBy: newRequestId,
                originalStartDate: oldRequest.startDate,
            },
        })

        await cleanupRequestDataInRange(
            tx,
            oldRequest.userId,
            oldRange.startDateTime,
            newEndDateTime,
            oldRequest.type
        )
        return
    }

    const split = oldRange.startDateTime < newStartDateTime && oldRange.endDateTime > newEndDateTime

    if (split) {
        const firstPartEndDate = endOfDay(new Date(newStartDateTime))
        firstPartEndDate.setDate(firstPartEndDate.getDate() - 1)

        await tx.request.update({
            where: { id: oldRequest.id },
            data: {
                endDate: firstPartEndDate,
                trimmedBy: newRequestId,
                originalEndDate: oldRequest.endDate,
            },
        })

        const secondPartStartDate = startOfDay(new Date(newEndDateTime))
        secondPartStartDate.setDate(secondPartStartDate.getDate() + 1)

        await tx.request.create({
            data: {
                userId: oldRequest.userId,
                type: oldRequest.type,
                status: "APPROVED",
                startDate: secondPartStartDate,
                endDate: oldRequest.endDate,
                startTime: oldRequest.startTime,
                endTime: oldRequest.endTime,
                isFullDay: oldRequest.isFullDay,
                requestedHours: oldRequest.requestedHours as number | null,
                reason: `Split from original request due to overlap`,
                affectsHourType: oldRequest.affectsHourType,
                skipWeekends: oldRequest.skipWeekends,
                skipHolidays: oldRequest.skipHolidays,
                approvedBy: oldRequest.approvedBy,
                approvedAt: new Date(),
                splitFrom: oldRequest.id,
            },
        })

        await cleanupRequestDataInRange(
            tx,
            oldRequest.userId,
            newStartDateTime,
            newEndDateTime,
            oldRequest.type
        )
    }
}

type ApproveableRequest = Awaited<ReturnType<typeof prisma.request.findUnique>> & object

export async function executeApproval(request: ApproveableRequest, approvedById?: string) {
    const { startDateTime, endDateTime } = getRequestDateTimeRange(request)

    await prisma.$transaction(async (tx) => {
        const overlappingRequests = await findOverlappingRequests(
            tx,
            request.userId,
            startDateTime,
            endDateTime,
            request.id
        )

        for (const oldRequest of overlappingRequests) {
            await trimOverlappingRequest(tx, oldRequest, startDateTime, endDateTime, request.id)
        }

        await tx.request.update({
            where: { id: request.id },
            data: {
                status: "APPROVED",
                approvedBy: approvedById ?? null,
                urnikNetStatus: approvedById ? undefined : "CONFIRMED",
                approvedAt: new Date(),
            },
        })

        const holidays = request.skipHolidays
            ? await tx.holiday.findMany({
                  where: {
                      date: {
                          gte: request.startDate,
                          lte: request.endDate,
                      },
                  },
              })
            : []

        const shiftLocation = mapRequestTypeToShiftLocation(request.type)

        const startDay = new Date(request.startDate)
        startDay.setUTCHours(0, 0, 0, 0)
        const endDay = new Date(request.endDate)
        endDay.setUTCHours(0, 0, 0, 0)

        const daysDiff = Math.round((endDay.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24))

        for (let i = 0; i <= daysDiff; i++) {
            const currentDay = new Date(startDay)
            currentDay.setUTCDate(startDay.getUTCDate() + i)

            const dayOfWeek = currentDay.getDay()
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

            const isHol =
                request.skipHolidays &&
                holidays.some((h) => {
                    const holidayDate = startOfDay(new Date(h.date))
                    return holidayDate.getTime() === currentDay.getTime()
                })

            if ((!request.skipWeekends || !isWeekend) && !isHol) {
                let shiftStartDateTime: Date
                let shiftEndDateTime: Date

                if (request.isFullDay || !request.startTime || !request.endTime) {
                    shiftStartDateTime = startOfDay(new Date(currentDay))
                    shiftEndDateTime = endOfDay(new Date(currentDay))
                } else {
                    const isFirstDay = i === 0
                    const isLastDay = i === daysDiff

                    if (isFirstDay) {
                        const [startHour, startMin] = request.startTime.split(":").map(Number)
                        shiftStartDateTime = new Date(currentDay)
                        shiftStartDateTime.setHours(startHour, startMin, 0, 0)
                    } else {
                        shiftStartDateTime = startOfDay(new Date(currentDay))
                    }

                    if (isLastDay) {
                        const [endHour, endMin] = request.endTime.split(":").map(Number)
                        shiftEndDateTime = new Date(currentDay)
                        shiftEndDateTime.setHours(endHour, endMin, 0, 0)
                    } else {
                        shiftEndDateTime = endOfDay(new Date(currentDay))
                    }
                }

                await tx.shift.create({
                    data: {
                        userId: request.userId,
                        date: currentDay,
                        startDateTime: shiftStartDateTime,
                        endDateTime: shiftEndDateTime,
                        location: shiftLocation,
                        notes: `Auto-generated from ${request.type.toLowerCase()} request`,
                    },
                })
            }
        }

        if (request.affectsHourType) {
            const targetHourType = mapRequestTypeToHourType(request.type)

            if (request.type === "VACATION" || request.type === "SICK_LEAVE") {
                const vacationSickLeaveTasks = await tx.task.findMany({
                    where: {
                        userId: request.userId,
                        title: {
                            in: ["System: VACATION", "System: SICK_LEAVE"],
                        },
                    },
                    select: { id: true },
                })

                if (vacationSickLeaveTasks.length > 0) {
                    const taskIds = vacationSickLeaveTasks.map((t) => t.id)

                    const deleteStartDate = new Date(request.startDate)
                    deleteStartDate.setUTCHours(0, 0, 0, 0)
                    const deleteEndDate = new Date(request.endDate)
                    deleteEndDate.setUTCHours(23, 59, 59, 999)

                    await tx.taskTimeEntry.deleteMany({
                        where: {
                            userId: request.userId,
                            taskId: { in: taskIds },
                            startTime: {
                                gte: deleteStartDate,
                                lte: deleteEndDate,
                            },
                            type: {
                                in: ["VACATION", "SICK_LEAVE"],
                            },
                        },
                    })
                }

                const requestUser = await tx.user.findUnique({
                    where: { id: request.userId },
                    select: {
                        workStartTime: true,
                        workEndTime: true,
                        workHoursPerDay: true,
                    },
                })

                const userWorkHours = requestUser?.workHoursPerDay || 8
                const userStartTime = requestUser?.workStartTime || "08:00"
                const userEndTime = requestUser?.workEndTime || "16:00"

                const taskStartDay = new Date(request.startDate)
                taskStartDay.setUTCHours(0, 0, 0, 0)
                const taskEndDay = new Date(request.endDate)
                taskEndDay.setUTCHours(0, 0, 0, 0)

                const taskDaysDiff = Math.round(
                    (taskEndDay.getTime() - taskStartDay.getTime()) / (1000 * 60 * 60 * 24)
                )

                const systemTaskTitle = `System: ${request.type}`
                let systemTask = await tx.task.findFirst({
                    where: {
                        userId: request.userId,
                        title: systemTaskTitle,
                    },
                })

                if (!systemTask) {
                    systemTask = await tx.task.create({
                        data: {
                            userId: request.userId,
                            title: systemTaskTitle,
                            description: "Automatically created for request tracking",
                            status: "DONE",
                            isSystemTask: true,
                        },
                    })
                }

                for (let i = 0; i <= taskDaysDiff; i++) {
                    const currentDay = new Date(taskStartDay)
                    currentDay.setUTCDate(taskStartDay.getUTCDate() + i)

                    const dayOfWeek = currentDay.getUTCDay()
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

                    const isHoliday = holidays.some((h) => {
                        const holidayDate = new Date(h.date)
                        holidayDate.setUTCHours(0, 0, 0, 0)
                        return holidayDate.getTime() === currentDay.getTime()
                    })

                    const shouldSkip =
                        (request.skipWeekends && isWeekend) || (request.skipHolidays && isHoliday)

                    if (!shouldSkip) {
                        let entryStart: Date
                        let entryEnd: Date
                        let hours: number

                        if (request.isFullDay || !request.startTime || !request.endTime) {
                            hours = userWorkHours
                            const [startHour, startMin] = userStartTime.split(":").map(Number)
                            const [endHour, endMin] = userEndTime.split(":").map(Number)
                            entryStart = new Date(currentDay)
                            entryStart.setUTCHours(startHour, startMin, 0, 0)
                            entryEnd = new Date(currentDay)
                            entryEnd.setUTCHours(endHour, endMin, 0, 0)
                        } else {
                            const isFirstDay = i === 0
                            const isLastDay = i === taskDaysDiff

                            if (isFirstDay && isLastDay) {
                                hours = request.requestedHours
                                    ? Number(request.requestedHours)
                                    : userWorkHours
                                const [startHour, startMin] = request.startTime
                                    .split(":")
                                    .map(Number)
                                const [endHour, endMin] = request.endTime.split(":").map(Number)
                                entryStart = new Date(currentDay)
                                entryStart.setUTCHours(startHour, startMin, 0, 0)
                                entryEnd = new Date(currentDay)
                                entryEnd.setUTCHours(endHour, endMin, 0, 0)
                            } else if (isFirstDay) {
                                const [startHour, startMin] = request.startTime
                                    .split(":")
                                    .map(Number)
                                const [userEndHour, userEndMin] = userEndTime.split(":").map(Number)
                                entryStart = new Date(currentDay)
                                entryStart.setUTCHours(startHour, startMin, 0, 0)
                                entryEnd = new Date(currentDay)
                                entryEnd.setUTCHours(userEndHour, userEndMin, 0, 0)
                                hours =
                                    (userEndHour * 60 + userEndMin - startHour * 60 - startMin) / 60
                            } else if (isLastDay) {
                                const [endHour, endMin] = request.endTime.split(":").map(Number)
                                const [userStartHour, userStartMin] = userStartTime
                                    .split(":")
                                    .map(Number)
                                entryStart = new Date(currentDay)
                                entryStart.setUTCHours(userStartHour, userStartMin, 0, 0)
                                entryEnd = new Date(currentDay)
                                entryEnd.setUTCHours(endHour, endMin, 0, 0)
                                hours =
                                    (endHour * 60 + endMin - userStartHour * 60 - userStartMin) / 60
                            } else {
                                hours = userWorkHours
                                const [startHour, startMin] = userStartTime.split(":").map(Number)
                                const [endHour, endMin] = userEndTime.split(":").map(Number)
                                entryStart = new Date(currentDay)
                                entryStart.setUTCHours(startHour, startMin, 0, 0)
                                entryEnd = new Date(currentDay)
                                entryEnd.setUTCHours(endHour, endMin, 0, 0)
                            }
                        }

                        await tx.taskTimeEntry.create({
                            data: {
                                taskId: systemTask.id,
                                userId: request.userId,
                                startTime: entryStart,
                                endTime: entryEnd,
                                duration: Math.round(hours * 3600),
                                type: targetHourType,
                            },
                        })
                    }
                }
            } else {
                const typesToRemap = ["WORK", "WORK_FROM_HOME"]

                const hourEntryStartDate = new Date(request.startDate)
                hourEntryStartDate.setUTCHours(0, 0, 0, 0)
                const hourEntryEndDate = new Date(request.endDate)
                hourEntryEndDate.setUTCHours(23, 59, 59, 999)

                for (const oldType of typesToRemap) {
                    if (oldType !== targetHourType) {
                        await tx.hourEntry.updateMany({
                            where: {
                                userId: request.userId,
                                date: {
                                    gte: hourEntryStartDate,
                                    lte: hourEntryEndDate,
                                },
                                type: oldType as HourType,
                                taskId: null,
                            },
                            data: { type: targetHourType },
                        })
                    }
                }

                if (request.isFullDay || !request.startTime || !request.endTime) {
                    const fullDayStart = new Date(request.startDate)
                    fullDayStart.setUTCHours(0, 0, 0, 0)
                    const fullDayEnd = new Date(request.endDate)
                    fullDayEnd.setUTCHours(23, 59, 59, 999)

                    const systemTasks = await tx.task.findMany({
                        where: {
                            userId: request.userId,
                            title: {
                                in: ["System: VACATION", "System: SICK_LEAVE"],
                            },
                        },
                        select: { id: true },
                    })
                    const systemTaskIds = systemTasks.map((t) => t.id)

                    for (const oldType of typesToRemap) {
                        if (oldType !== targetHourType) {
                            await tx.taskTimeEntry.updateMany({
                                where: {
                                    userId: request.userId,
                                    startTime: { gte: fullDayStart, lte: fullDayEnd },
                                    type: oldType as HourType,
                                    NOT: { taskId: { in: systemTaskIds } },
                                },
                                data: { type: targetHourType },
                            })
                        }
                    }
                } else {
                    const { startDateTime: reqStart, endDateTime: reqEnd } =
                        getRequestDateTimeRange(request)

                    const calendarStart = new Date(request.startDate)
                    calendarStart.setUTCHours(0, 0, 0, 0)
                    const calendarEnd = new Date(request.endDate)
                    calendarEnd.setUTCHours(23, 59, 59, 999)

                    const systemTasks = await tx.task.findMany({
                        where: {
                            userId: request.userId,
                            title: {
                                in: ["System: VACATION", "System: SICK_LEAVE"],
                            },
                        },
                        select: { id: true },
                    })
                    const systemTaskIds = systemTasks.map((t) => t.id)

                    for (const oldType of typesToRemap) {
                        if (oldType === targetHourType) continue

                        const entries = await tx.taskTimeEntry.findMany({
                            where: {
                                userId: request.userId,
                                startTime: { gte: calendarStart, lte: calendarEnd },
                                type: oldType as HourType,
                                NOT: { taskId: { in: systemTaskIds } },
                            },
                        })

                        for (const entry of entries) {
                            if (!entry.endTime) {
                                if (entry.startTime >= reqStart && entry.startTime < reqEnd) {
                                    await tx.taskTimeEntry.update({
                                        where: { id: entry.id },
                                        data: { type: targetHourType },
                                    })
                                }
                                continue
                            }

                            const entryStart = entry.startTime
                            const entryEnd = entry.endTime

                            if (entryEnd <= reqStart || entryStart >= reqEnd) continue

                            const fullyContained = entryStart >= reqStart && entryEnd <= reqEnd
                            const straddles = entryStart < reqStart && entryEnd > reqEnd
                            const leftOverlap =
                                entryStart < reqStart && entryEnd > reqStart && entryEnd <= reqEnd
                            const rightOverlap =
                                entryStart >= reqStart && entryStart < reqEnd && entryEnd > reqEnd

                            if (fullyContained) {
                                await tx.taskTimeEntry.update({
                                    where: { id: entry.id },
                                    data: { type: targetHourType },
                                })
                            } else if (straddles) {
                                const leftDuration = Math.round(
                                    (reqStart.getTime() - entryStart.getTime()) / 1000
                                )
                                const middleDuration = Math.round(
                                    (reqEnd.getTime() - reqStart.getTime()) / 1000
                                )
                                const rightDuration = Math.round(
                                    (entryEnd.getTime() - reqEnd.getTime()) / 1000
                                )

                                await tx.taskTimeEntry.update({
                                    where: { id: entry.id },
                                    data: {
                                        endTime: reqStart,
                                        duration: leftDuration,
                                    },
                                })

                                await tx.taskTimeEntry.create({
                                    data: {
                                        taskId: entry.taskId,
                                        userId: request.userId,
                                        startTime: reqStart,
                                        endTime: reqEnd,
                                        duration: middleDuration,
                                        type: targetHourType,
                                    },
                                })

                                await tx.taskTimeEntry.create({
                                    data: {
                                        taskId: entry.taskId,
                                        userId: request.userId,
                                        startTime: reqEnd,
                                        endTime: entryEnd,
                                        duration: rightDuration,
                                        type: oldType as HourType,
                                    },
                                })
                            } else if (leftOverlap) {
                                const leftDuration = Math.round(
                                    (reqStart.getTime() - entryStart.getTime()) / 1000
                                )
                                const rightDuration = Math.round(
                                    (entryEnd.getTime() - reqStart.getTime()) / 1000
                                )

                                await tx.taskTimeEntry.update({
                                    where: { id: entry.id },
                                    data: {
                                        endTime: reqStart,
                                        duration: leftDuration,
                                    },
                                })

                                await tx.taskTimeEntry.create({
                                    data: {
                                        taskId: entry.taskId,
                                        userId: request.userId,
                                        startTime: reqStart,
                                        endTime: entryEnd,
                                        duration: rightDuration,
                                        type: targetHourType,
                                    },
                                })
                            } else if (rightOverlap) {
                                const leftDuration = Math.round(
                                    (reqEnd.getTime() - entryStart.getTime()) / 1000
                                )
                                const rightDuration = Math.round(
                                    (entryEnd.getTime() - reqEnd.getTime()) / 1000
                                )

                                await tx.taskTimeEntry.update({
                                    where: { id: entry.id },
                                    data: {
                                        endTime: reqEnd,
                                        duration: leftDuration,
                                        type: targetHourType,
                                    },
                                })

                                await tx.taskTimeEntry.create({
                                    data: {
                                        taskId: entry.taskId,
                                        userId: request.userId,
                                        startTime: reqEnd,
                                        endTime: entryEnd,
                                        duration: rightDuration,
                                        type: oldType as HourType,
                                    },
                                })
                            }
                        }
                    }
                }
            }
        }
    })

    await refreshDailyHourSummary()

    const requestUser = await prisma.user.findUnique({
        where: { id: request.userId },
        select: { name: true, email: true },
    })

    notifyUserApproval({
        userId: request.userId,
        userName: requestUser?.name || requestUser?.email || "User",
        requestType: request.type,
        startDate: request.startDate,
        endDate: request.endDate,
        reason: request.reason || undefined,
        approvedByName: approvedById ? "Admin" : "Urnik.net",
    }).catch((error) => {
        console.error("Failed to notify user of approval:", error)
    })

    revalidatePath("/requests")
    revalidatePath("/hours")
    revalidatePath("/shifts")
    return { success: true }
}

export async function executeRejection(
    request: ApproveableRequest,
    rejectionReason: string | undefined,
    rejectedById?: string
) {
    await prisma.$transaction(async (tx) => {
        await tx.request.update({
            where: { id: request.id },
            data: {
                status: "REJECTED",
                rejectedBy: rejectedById ?? null,
                urnikNetStatus: rejectedById ? undefined : "REJECTED",
                rejectedAt: new Date(),
                rejectionReason,
            },
        })

        await tx.shift.deleteMany({
            where: {
                userId: request.userId,
                date: {
                    gte: request.startDate,
                    lte: request.endDate,
                },
                notes: { contains: "Auto-generated from" },
            },
        })
    })

    const requestUser = await prisma.user.findUnique({
        where: { id: request.userId },
        select: { name: true, email: true },
    })

    notifyUserRejection({
        userId: request.userId,
        userName: requestUser?.name || requestUser?.email || "User",
        requestType: request.type,
        startDate: request.startDate,
        endDate: request.endDate,
        reason: request.reason || undefined,
        rejectedByName: rejectedById ? "Admin" : "Urnik.net",
        rejectionReason: rejectionReason || "No reason provided",
    }).catch((error) => {
        console.error("Failed to notify user of rejection:", error)
    })

    revalidatePath("/requests")
    revalidatePath("/shifts")
    return { success: true }
}
