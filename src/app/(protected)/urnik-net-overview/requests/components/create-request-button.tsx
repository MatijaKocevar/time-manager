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
import type { UrnikDayRequestType } from "../schemas/create-urnik-net-day-request-schema"

interface CreateRequestButtonProps {
    label: string
    typeWork: string
    typeWorkFromHome: string
    hoursLabel: string
    daysLabel: string
    typeVacation: string
    typeSickLeave: string
    typeDayWorkFromHome: string
}

export function CreateRequestButton({
    label,
    typeWork,
    typeWorkFromHome,
    hoursLabel,
    daysLabel,
    typeVacation,
    typeSickLeave,
    typeDayWorkFromHome,
}: CreateRequestButtonProps) {
    const openDialog = useCreateRequestStore((state) => state.openDialog)
    const setSelectedType = useCreateRequestStore((state) => state.setSelectedType)
    const setRequestCategory = useCreateRequestStore((state) => state.setRequestCategory)

    const handleSelectHourType = (type: UrnikNetRequestType) => {
        setRequestCategory("HOUR")
        setSelectedType(type)
        openDialog()
    }

    const handleSelectDayType = (type: UrnikDayRequestType) => {
        setRequestCategory("DAY")
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
                        <DropdownMenuItem onClick={() => handleSelectHourType("WORK")}>
                            {typeWork}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSelectHourType("WORK_FROM_HOME")}>
                            {typeWorkFromHome}
                        </DropdownMenuItem>
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>{daysLabel}</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        <DropdownMenuItem onClick={() => handleSelectDayType("VACATION")}>
                            {typeVacation}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSelectDayType("SICK_LEAVE")}>
                            {typeSickLeave}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSelectDayType("WORK_FROM_HOME")}>
                            {typeDayWorkFromHome}
                        </DropdownMenuItem>
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
