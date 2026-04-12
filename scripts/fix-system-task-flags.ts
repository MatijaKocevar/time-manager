import { prisma } from "../src/lib/prisma"

async function fixSystemTaskFlags() {
    console.log("Starting system task flag fix...")

    try {
        const result = await prisma.task.updateMany({
            where: {
                OR: [
                    { title: { startsWith: "System: " } },
                    {
                        title: {
                            in: [
                                "Work",
                                "Vacation",
                                "Sick Leave",
                                "Work from Home",
                                "Break",
                                "Private",
                            ],
                        },
                    },
                ],
                isSystemTask: false,
            },
            data: {
                isSystemTask: true,
            },
        })

        console.log(`✅ Updated ${result.count} system tasks to have isSystemTask: true`)

        const systemTasks = await prisma.task.findMany({
            where: {
                OR: [
                    { title: { startsWith: "System: " } },
                    {
                        title: {
                            in: [
                                "Work",
                                "Vacation",
                                "Sick Leave",
                                "Work from Home",
                                "Break",
                                "Private",
                            ],
                        },
                    },
                ],
            },
            select: {
                id: true,
                title: true,
                isSystemTask: true,
                userId: true,
            },
        })

        console.log("\nAll system tasks after fix:")
        systemTasks.forEach((task) => {
            console.log(
                `  - ${task.title} (User: ${task.userId}, isSystemTask: ${task.isSystemTask})`
            )
        })

        console.log(`\nTotal system tasks: ${systemTasks.length}`)
    } catch (error) {
        console.error("Error fixing system task flags:", error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

fixSystemTaskFlags()
    .then(() => {
        console.log("\n✅ System task flag fix completed successfully")
        process.exit(0)
    })
    .catch((error) => {
        console.error("\n❌ System task flag fix failed:", error)
        process.exit(1)
    })
