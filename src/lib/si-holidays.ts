import { SI_HOLIDAYS, SI_HOLIDAYS_SOURCE, type SiHoliday } from "../../prisma/data/si-holidays-data"

export { SI_HOLIDAYS_SOURCE, type SiHoliday }

const NON_WORK_FREE_NOT_IN_SNAPSHOT = {
    english: ["Slovenian Sports Day"],
    slovenian: ["dan slovenskega športa"],
}

export function getSiHolidays(year: number): SiHoliday[] {
    const prefix = `${year}-`
    return SI_HOLIDAYS.filter((holiday) => holiday.date.startsWith(prefix))
}

export function getWorkFreeHolidays(year: number): SiHoliday[] {
    return getSiHolidays(year).filter((holiday) => holiday.workFree)
}

export function getNonWorkFreeNameSets(): { english: Set<string>; slovenian: Set<string> } {
    const english = new Set(NON_WORK_FREE_NOT_IN_SNAPSHOT.english)
    const slovenian = new Set(NON_WORK_FREE_NOT_IN_SNAPSHOT.slovenian)

    for (const holiday of SI_HOLIDAYS) {
        if (!holiday.workFree) {
            english.add(holiday.nameEn)
            slovenian.add(holiday.nameSl)
        }
    }

    return { english, slovenian }
}
