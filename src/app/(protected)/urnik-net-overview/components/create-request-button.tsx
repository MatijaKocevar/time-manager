"use client"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"
import { useCreateRequestStore } from "../stores/create-request-store"
import type { UrnikNetRequestType } from "../schemas/create-urnik-net-request-schema"

interface CreateRequestButtonProps {
    label: string
    typeWork: string
    typeWorkFromHome: string
    hoursLabel: string
}

export function CreateRequestButton({
    label,
    typeWork,
    typeWorkFromHome,
    hoursLabel,
}: CreateRequestButtonProps) {
    const openDialog = useCreateRequestStore((state) => state.openDialog)
    const setSelectedType = useCreateRequestStore((state) => state.setSelectedType)

    const handleSelectType = (type: UrnikNetRequestType) => {
        setSelectedType(type)
        openDialog()
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="default">
                    {label}
                    <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>{hoursLabel}</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        <DropdownMenuItem onClick={() => handleSelectType("WORK")}>
                            {typeWork}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSelectType("WORK_FROM_HOME")}>
                            {typeWorkFromHome}
                        </DropdownMenuItem>
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
