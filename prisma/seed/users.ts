import { PrismaClient } from "../generated/client"
import bcrypt from "bcryptjs"
import { SeededRandom, FIRST_NAMES, LAST_NAMES } from "./utils"

export async function seedUsers(
    prisma: PrismaClient,
    random: SeededRandom,
    count: number,
    adminCount: number
) {
    console.log(`\n📊 Seeding ${count} users (${adminCount} admins)...`)
    const hashedPassword = await bcrypt.hash("password123", 12)

    const users: Array<{ email: string; name: string; password: string; role: "USER" | "ADMIN" }> =
        []

    for (let i = 0; i < count; i++) {
        const firstName = random.choice(FIRST_NAMES)
        const lastName = random.choice(LAST_NAMES)
        const role = i < adminCount ? "ADMIN" : "USER"

        users.push({
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
            name: `${firstName} ${lastName}`,
            password: hashedPassword,
            role,
        })
    }

    const createdUsers = await prisma.$transaction(async (tx) => {
        const results = []
        for (const userData of users) {
            const user = await tx.user.upsert({
                where: { email: userData.email },
                update: { password: userData.password, role: userData.role },
                create: userData,
            })
            results.push(user)
        }
        return results
    })

    console.log(`✅ Created ${createdUsers.length} users`)
    return createdUsers
}
