import type { TaskDisplay } from "@/app/(protected)/tasks/_schemas/task-schemas"
import type { HourType } from "@/../../prisma/generated/client"

export interface TrackerDisplayProps {
    inProgressTasks: TaskDisplay[]
    generalWorkTask: { id: string; title: string } | null
    initialSelectedType: HourType
    initialSelectedTaskId: string | null
    initialActiveTimer: {
        id: string
        taskId: string
        userId: string
        startTime: Date
        endTime: Date | null
        duration: number | null
        createdAt: Date
        updatedAt: Date
        type: HourType
        task: {
            id: string
            title: string
            isSystemTask: boolean
        }
    } | null
    initialTodayEntries: Array<{
        id: string
        userId: string
        taskId: string
        startTime: Date
        endTime: Date | null
        duration: number | null
        createdAt: Date
        updatedAt: Date
        type: HourType
    }>
    initialDailySummary: {
        totals: Record<"WORK" | "BREAK" | "PRIVATE", number>
        activeTimer: {
            id: string
            startTime: Date
            type: HourType
        } | null
    }
    translations: {
        selectType: string
        selectTask: string
        trackingType: string
        todayEntries: string
        work: string
        workFromHome: string
        break: string
        private: string
        noTasksAvailable: string
        generalWork: string
        dailySummaryTitle: string
        arrivalDialogTitle: string
        arrivalDialogMessage: string
        arrivalDialogYes: string
        arrivalDialogNo: string
        arrivalDialogSuccess: string
        errorTitle: string
        arrivalDialogWorkFromHome: string
        arrivalDialogWorkFromHomeApproved: string
    }
}
