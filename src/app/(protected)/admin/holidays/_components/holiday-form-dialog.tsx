"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"

export type Holiday = {
    id: string
    date: Date
    name: string
    description: string | null
    isRecurring: boolean
    createdAt: Date
    updatedAt: Date
}

interface HolidayFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    editingHoliday?: Holiday | null
    onSubmit: (formData: {
        date: string
        name: string
        description: string
        isRecurring: boolean
    }) => void
    isPending: boolean
    translations: {
        addHoliday: string
        editHoliday: string
        date: string
        name: string
        description: string
        recurringAnnually: string
        cancel: string
        create: string
        update: string
    }
}

function getInitialFormData(editingHoliday?: Holiday | null) {
    if (editingHoliday) {
        return {
            date: new Date(editingHoliday.date).toISOString().split("T")[0],
            name: editingHoliday.name,
            description: editingHoliday.description || "",
            isRecurring: editingHoliday.isRecurring,
        }
    }
    return {
        date: "",
        name: "",
        description: "",
        isRecurring: false,
    }
}

export function HolidayFormDialog({
    open,
    onOpenChange,
    editingHoliday,
    onSubmit,
    isPending,
    translations,
}: HolidayFormDialogProps) {
    const resetKey = editingHoliday ? `edit-${editingHoliday.id}` : "create"

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button id="holidays-add-btn">
                    <Plus className="h-4 w-4 mr-2" />
                    {translations.addHoliday}
                </Button>
            </DialogTrigger>
            <DialogContent key={resetKey}>
                <DialogHeader>
                    <DialogTitle>
                        {editingHoliday ? translations.editHoliday : translations.addHoliday}
                    </DialogTitle>
                </DialogHeader>
                <HolidayForm
                    initialData={getInitialFormData(editingHoliday)}
                    isEditing={!!editingHoliday}
                    onSubmit={onSubmit}
                    onCancel={() => onOpenChange(false)}
                    isPending={isPending}
                    translations={translations}
                />
            </DialogContent>
        </Dialog>
    )
}

interface HolidayFormProps {
    initialData: { date: string; name: string; description: string; isRecurring: boolean }
    isEditing: boolean
    onSubmit: (formData: {
        date: string
        name: string
        description: string
        isRecurring: boolean
    }) => void
    onCancel: () => void
    isPending: boolean
    translations: {
        date: string
        name: string
        description: string
        recurringAnnually: string
        cancel: string
        create: string
        update: string
    }
}

function HolidayForm({
    initialData,
    isEditing,
    onSubmit,
    onCancel,
    isPending,
    translations,
}: HolidayFormProps) {
    const [formData, setFormData] = useState(initialData)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit(formData)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label htmlFor="date">{translations.date}</Label>
                <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                />
            </div>
            <div>
                <Label htmlFor="name">{translations.name}</Label>
                <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    maxLength={100}
                />
            </div>
            <div>
                <Label htmlFor="description">{translations.description}</Label>
                <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                        setFormData({
                            ...formData,
                            description: e.target.value,
                        })
                    }
                    maxLength={500}
                />
            </div>
            <div className="flex items-center space-x-2">
                <input
                    id="isRecurring"
                    type="checkbox"
                    checked={formData.isRecurring}
                    onChange={(e) =>
                        setFormData({
                            ...formData,
                            isRecurring: e.target.checked,
                        })
                    }
                    className="h-4 w-4"
                />
                <Label htmlFor="isRecurring">{translations.recurringAnnually}</Label>
            </div>
            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                    {translations.cancel}
                </Button>
                <Button type="submit" disabled={isPending}>
                    {isEditing ? translations.update : translations.create}
                </Button>
            </div>
        </form>
    )
}
