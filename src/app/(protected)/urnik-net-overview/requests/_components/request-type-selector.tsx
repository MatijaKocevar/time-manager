"use client"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useCreateRequestStore } from "../_stores/create-request-store"
import type { UrnikNetRequestType } from "../_schemas/create-urnik-net-request-schema"

interface RequestTypeSelectorProps {
    label: string
    placeholder: string
    typeWork: string
    typeWorkFromHome: string
    disabled?: boolean
}

export function RequestTypeSelector({
    label,
    placeholder,
    typeWork,
    typeWorkFromHome,
    disabled = false,
}: RequestTypeSelectorProps) {
    const selectedType = useCreateRequestStore((state) => state.selectedType)
    const setSelectedType = useCreateRequestStore((state) => state.setSelectedType)

    const handleValueChange = (value: string) => {
        setSelectedType(value as UrnikNetRequestType)
    }

    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <Select
                value={selectedType || undefined}
                onValueChange={handleValueChange}
                disabled={disabled}
            >
                <SelectTrigger className="w-full">
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="WORK">{typeWork}</SelectItem>
                    <SelectItem value="WORK_FROM_HOME">{typeWorkFromHome}</SelectItem>
                </SelectContent>
            </Select>
        </div>
    )
}
