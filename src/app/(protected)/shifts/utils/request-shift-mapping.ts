import type { ShiftLocation } from "../schemas/shift-schemas"

type RequestType = "VACATION" | "SICK_LEAVE" | "WORK_FROM_HOME" | "REMOTE_WORK" | "OTHER"

export function mapRequestTypeToShiftLocation(type: RequestType): ShiftLocation {
    switch (type) {
        case "VACATION":
            return "VACATION"
        case "SICK_LEAVE":
            return "SICK_LEAVE"
        case "WORK_FROM_HOME":
        case "REMOTE_WORK":
            return "HOME"
        case "OTHER":
            return "OTHER"
    }
}

export function isWeekday(date: Date): boolean {
    const day = date.getDay()
    return day !== 0 && day !== 6
}
