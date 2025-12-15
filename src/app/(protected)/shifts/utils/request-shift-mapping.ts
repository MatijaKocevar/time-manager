import type { ShiftLocation } from "../schemas/shift-schemas"
import { REQUEST_TYPE } from "@/app/(protected)/requests/constants"
import { SHIFT_LOCATION } from "../constants"

type RequestType = (typeof REQUEST_TYPE)[keyof typeof REQUEST_TYPE]
type HourType = "WORK" | "WORK_FROM_HOME" | "VACATION" | "SICK_LEAVE" | "OTHER"

export function mapRequestTypeToShiftLocation(type: RequestType): ShiftLocation {
    switch (type) {
        case REQUEST_TYPE.VACATION:
            return SHIFT_LOCATION.VACATION
        case REQUEST_TYPE.SICK_LEAVE:
            return SHIFT_LOCATION.SICK_LEAVE
        case REQUEST_TYPE.WORK_FROM_HOME:
            return SHIFT_LOCATION.HOME
        case REQUEST_TYPE.OTHER:
            return SHIFT_LOCATION.OTHER
    }
}

export function mapShiftLocationToHourType(location: ShiftLocation): HourType {
    switch (location) {
        case SHIFT_LOCATION.OFFICE:
            return "WORK"
        case SHIFT_LOCATION.HOME:
            return "WORK_FROM_HOME"
        case SHIFT_LOCATION.VACATION:
            return "VACATION"
        case SHIFT_LOCATION.SICK_LEAVE:
            return "SICK_LEAVE"
        case SHIFT_LOCATION.OTHER:
            return "OTHER"
    }
}

export function mapRequestTypeToHourType(type: RequestType): HourType {
    switch (type) {
        case REQUEST_TYPE.VACATION:
            return "VACATION"
        case REQUEST_TYPE.SICK_LEAVE:
            return "SICK_LEAVE"
        case REQUEST_TYPE.WORK_FROM_HOME:
            return "WORK_FROM_HOME"
        case REQUEST_TYPE.OTHER:
            return "OTHER"
    }
}

export function isWeekday(date: Date): boolean {
    const day = date.getDay()
    return day !== 0 && day !== 6
}
