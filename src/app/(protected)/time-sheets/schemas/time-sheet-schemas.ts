import { z } from "zod"

export const GetTimeSheetEntriesSchema = z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
})

export type GetTimeSheetEntriesInput = z.infer<typeof GetTimeSheetEntriesSchema>
