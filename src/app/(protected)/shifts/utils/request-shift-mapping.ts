import type { ShiftLocation } from "../schemas/shift-schemas"
import { REQUEST_TYPE } from "@/app/(protected)/requests/constants"
import { SHIFT_LOCATION } from "../constants"

type RequestType = (typeof REQUEST_TYPE)[keyof typeof REQUEST_TYPE]

export function mapRequestTypeToShiftLocation(type: RequestType): ShiftLocation {
    switch (type) {
        case REQUEST_TYPE.VACATION:
            return SHIFT_LOCATION.VACATION
        case REQUEST_TYPE.SICK_LEAVE:
            return SHIFT_LOCATION.SICK_LEAVE
        case REQUEST_TYPE.WORK_FROM_HOME:
        case REQUEST_TYPE.REMOTE_WORK:
            return SHIFT_LOCATION.HOME
        case REQUEST_TYPE.OTHER:
            return SHIFT_LOCATION.OTHER
    }
}

export function isWeekday(date: Date): boolean {
    const day = date.getDay()
    return day !== 0 && day !== 6
}
