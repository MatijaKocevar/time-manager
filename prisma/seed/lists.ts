import { PrismaClient } from "../generated/client"
import { SeededRandom, LIST_TEMPLATES } from "./utils"

export async function seedListsForUser(prisma: PrismaClient, random: SeededRandom, userId: string) {
    const listCount = random.nextInt(3, 5)
    const selectedLists = random.shuffle(LIST_TEMPLATES).slice(0, listCount)

    const lists = await prisma.$transaction(async (tx) => {
        const results = []
        for (let i = 0; i < selectedLists.length; i++) {
            const template = selectedLists[i]
            const list = await tx.list.upsert({
                where: {
                    userId_name: { userId, name: template.name },
                },
                update: {},
                create: {
                    userId,
                    name: template.name,
                    description: template.description,
                    color: template.color,
                    icon: template.icon,
                    order: i,
                    isDefault: i === 0,
                },
            })
            results.push(list)
        }
        return results
    })

    return lists
}
