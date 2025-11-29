import { PrismaClient } from "../generated/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
    console.log("🌱 Starting database seeding...")

    const hashedPassword = await bcrypt.hash("password123", 12)

    const testUser = await prisma.user.upsert({
        where: { email: "test@example.com" },
        update: {
            password: hashedPassword,
            role: "USER",
        },
        create: {
            email: "test@example.com",
            name: "Test User",
            password: hashedPassword,
            role: "USER",
        },
    })

    console.log("✅ Created test user:", testUser.email)

    const adminUser = await prisma.user.upsert({
        where: { email: "admin@example.com" },
        update: {
            password: hashedPassword,
            role: "ADMIN",
        },
        create: {
            email: "admin@example.com",
            name: "Admin User",
            password: hashedPassword,
            role: "ADMIN",
        },
    })

    console.log("✅ Created admin user:", adminUser.email)

    console.log("🌱 Database seeding completed!")
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error("❌ Error seeding database:", e)
        await prisma.$disconnect()
        process.exit(1)
    })
