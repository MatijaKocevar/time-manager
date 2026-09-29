import { readFileSync, writeFileSync } from "fs"
import { join } from "path"
import { execSync } from "child_process"

const SOURCE_PATH = join(process.cwd(), "prisma/data/si-prazniki-2000-2030.csv")
const OUTPUT_PATH = join(process.cwd(), "prisma/data/si-holidays-data.ts")
const SOURCE_URL =
    "https://podatki.gov.si/dataset/seznam-praznikov-in-dela-prostih-dni-v-republiki-sloveniji"

const NAME_TRANSLATIONS: Record<string, string> = {
    "novo leto": "New Year's Day",
    "Prešernov dan, slovenski kulturni praznik": "Prešeren Day",
    "velika noč": "Easter Sunday",
    "velikonočni ponedeljek": "Easter Monday",
    "dan boja proti okupatorju": "Day of Uprising Against Occupation",
    "praznik dela": "Labour Day",
    "binkoštna nedelja": "Pentecost",
    "dan državnosti": "Statehood Day",
    "Marijino vnebovzetje": "Assumption Day",
    "dan reformacije": "Reformation Day",
    "dan spomina na mrtve": "Day of the Dead",
    božič: "Christmas Day",
    "dan samostojnosti": "Independence and Unity Day",
    "dan samostojnosti in enotnosti": "Independence and Unity Day",
    "dan Primoža Trubarja": "Primož Trubar Day",
    "združitev prekmurskih Slovencev z matičnim narodom":
        "Unification of Prekmurje Slovenes with the Mother Nation",
    "vrnitev Primorske k matični domovini": "Integration of Primorska into the Homeland",
    "dan suverenosti": "Sovereignty Day",
    "dan Rudolfa Maistra": "Rudolf Maister Day",
}

interface HolidayRow {
    date: string
    nameEn: string
    nameSl: string
    workFree: boolean
}

function parseDate(raw: string): string {
    const [day, month, year] = raw.split(".").map(Number)
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

function parseHolidays(content: string): HolidayRow[] {
    return content
        .replace(/^\uFEFF/, "")
        .split(/\r?\n/)
        .slice(1)
        .filter((line) => line.trim().length > 0)
        .map((line) => {
            const [rawDate, rawName, , rawWorkFree] = line.split(";")
            const nameSl = rawName.trim()
            const nameEn = NAME_TRANSLATIONS[nameSl]

            if (!nameEn) {
                throw new Error(`Missing English translation for holiday: ${nameSl}`)
            }

            return {
                date: parseDate(rawDate.trim()),
                nameEn,
                nameSl,
                workFree: rawWorkFree.trim() === "da",
            }
        })
        .sort((a, b) => a.date.localeCompare(b.date))
}

function renderModule(rows: HolidayRow[]): string {
    return `export const SI_HOLIDAYS_SOURCE = ${JSON.stringify(SOURCE_URL)}

export interface SiHoliday {
    date: string
    nameEn: string
    nameSl: string
    workFree: boolean
}

export const SI_HOLIDAYS: SiHoliday[] = ${JSON.stringify(rows, null, 4)}
`
}

const rows = parseHolidays(readFileSync(SOURCE_PATH, "utf8"))

writeFileSync(OUTPUT_PATH, renderModule(rows))

execSync(`npx prettier --write "${OUTPUT_PATH}"`, { stdio: "inherit" })

console.log(`Generated ${OUTPUT_PATH} with ${rows.length} holidays`)
