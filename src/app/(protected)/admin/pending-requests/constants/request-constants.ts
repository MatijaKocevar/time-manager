import { getWorkTypeColor } from "@/lib/work-type-styles"

export const TYPE_COLORS: Record<string, string> = {
    VACATION: getWorkTypeColor("VACATION", "default"),
    SICK_LEAVE: getWorkTypeColor("SICK_LEAVE", "default"),
    WORK_FROM_HOME: getWorkTypeColor("WORK_FROM_HOME", "default"),
    REMOTE_WORK: getWorkTypeColor("WORK_FROM_HOME", "default"),
    OTHER: getWorkTypeColor("OTHER", "default"),
}
