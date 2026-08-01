import type { ShiftLocation } from "../_schemas/shift-schemas"

export const SHIFT_LOCATION_KEYS: Record<ShiftLocation, string> = {
    OFFICE: "shifts.locations.office",
    HOME: "shifts.locations.home",
    VACATION: "shifts.locations.vacation",
    SICK_LEAVE: "shifts.locations.sickLeave",
}

export function getShiftLocationLabel(t: (key: string) => string, location: ShiftLocation): string {
    return t(SHIFT_LOCATION_KEYS[location])
}
