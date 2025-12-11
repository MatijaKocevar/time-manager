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

    await prisma.list.upsert({
        where: {
            userId_name: {
                userId: testUser.id,
                name: "Personal",
            },
        },
        update: {},
        create: {
            userId: testUser.id,
            name: "Personal",
            description: "Personal tasks and projects",
            color: "#3b82f6",
            isDefault: true,
            order: 0,
        },
    })

    console.log("✅ Created default list for test user")

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

    await prisma.list.upsert({
        where: {
            userId_name: {
                userId: adminUser.id,
                name: "Personal",
            },
        },
        update: {},
        create: {
            userId: adminUser.id,
            name: "Personal",
            description: "Personal tasks and projects",
            color: "#3b82f6",
            isDefault: true,
            order: 0,
        },
    })

    console.log("✅ Created default list for admin user")

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
