import { z } from "zod"

export const PASSWORD_MIN_LENGTH = 6

export const RegisterSchema = z
    .object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Invalid email address"),
        password: z
            .string()
            .min(
                PASSWORD_MIN_LENGTH,
                `Password must be at least ${PASSWORD_MIN_LENGTH} characters`
            ),
        confirmPassword: z.string(),
        locale: z.enum(["en", "sl"]).default("en"),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    })

export type RegisterInput = z.infer<typeof RegisterSchema>
