"use server"

import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function getHasUrnikCredentials() {
    const session = await getServerSession(authConfig)

    if (!session?.user?.id) {
        return false
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { urnikUsername: true },
    })

    return !!user?.urnikUsername
}
