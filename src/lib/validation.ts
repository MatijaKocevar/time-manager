import type { ZodSchema, ZodType } from "zod"

export interface ValidationSuccess<T> {
    success: true
    data: T
}

export interface ValidationError {
    success: false
    error: string
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationError

export function validateInput<T>(
    schema: ZodSchema<T> | ZodType<T>,
    input: unknown
): ValidationResult<T> {
    const result = schema.safeParse(input)
    if (!result.success) {
        return { success: false, error: result.error.issues[0].message }
    }
    return { success: true, data: result.data }
}
