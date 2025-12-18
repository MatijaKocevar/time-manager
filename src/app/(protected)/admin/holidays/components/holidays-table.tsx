"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Edit, Plus, Trash2, Sparkles } from "lucide-react"
import { createHoliday, updateHoliday, deleteHoliday } from "../actions/holiday-actions"
import { autoGenerateUpcomingHolidays } from "../actions/generate-holidays"
import { holidayKeys } from "../query-keys"

type Holiday = {
    id: string
    date: Date
    name: string
    description: string | null
    isRecurring: boolean
    createdAt: Date
    updatedAt: Date
}

interface HolidaysTableProps {
    holidays: Holiday[]
    translations: {
        title: string
        table: {
            date: string
            name: string
            description: string
            recurring: string
            actions: string
            noHolidays: string
            yes: string
            no: string
        }
        form: {
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
        actions: {
            importPublicHolidays: string
            importing: string
            deleteConfirm: string
        }
    }
}

export function HolidaysTable({ holidays, translations }: HolidaysTableProps) {
    const tActions = useTranslations("admin.holidays.actions")
    const queryClient = useQueryClient()
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null)
    const [formData, setFormData] = useState({
        date: "",
        name: "",
        description: "",
        isRecurring: false,
    })

    const createMutation = useMutation({
        mutationFn: createHoliday,
        onSuccess: (result) => {
            if (result.success) {
                queryClient.invalidateQueries({ queryKey: holidayKeys.all })
                setIsDialogOpen(false)
                resetForm()
            } else {
                alert(result.error || "Failed to create holiday")
            }
        },
    })

    const updateMutation = useMutation({
        mutationFn: updateHoliday,
        onSuccess: (result) => {
            if (result.success) {
                queryClient.invalidateQueries({ queryKey: holidayKeys.all })
                setIsDialogOpen(false)
                resetForm()
                setEditingHoliday(null)
            } else {
                alert(result.error || "Failed to update holiday")
            }
        },
    })

    const deleteMutation = useMutation({
        mutationFn: deleteHoliday,
        onSuccess: (result) => {
            if (result.success) {
                queryClient.invalidateQueries({ queryKey: holidayKeys.all })
            } else {
                alert(result.error || "Failed to delete holiday")
            }
        },
    })

    const generateMutation = useMutation({
        mutationFn: () => autoGenerateUpcomingHolidays("SI"),
        onSuccess: async (data) => {
            if (data.success) {
                await queryClient.refetchQueries({ queryKey: holidayKeys.all })
                const year = new Date().getFullYear()
                const nextYear = year + 1
                alert(
                    tActions("importSuccess", {
                        count: data.total,
                        year: year,
                        nextYear: nextYear,
                    })
                )
            }
        },
        onError: (error) => {
            alert(tActions("importError", { error: error.message }))
        },
    })

    const resetForm = () => {
        setFormData({
            date: "",
            name: "",
            description: "",
            isRecurring: false,
        })
    }

    const handleEdit = (holiday: Holiday) => {
        setEditingHoliday(holiday)
        setFormData({
            date: new Date(holiday.date).toISOString().split("T")[0],
            name: holiday.name,
            description: holiday.description || "",
            isRecurring: holiday.isRecurring,
        })
        setIsDialogOpen(true)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        const dateObj = new Date(formData.date + "T00:00:00")

        if (editingHoliday) {
            updateMutation.mutate({
                id: editingHoliday.id,
                date: dateObj,
                name: formData.name,
                description: formData.description || undefined,
                isRecurring: formData.isRecurring,
            })
        } else {
            createMutation.mutate({
                date: dateObj,
                name: formData.name,
                description: formData.description || undefined,
                isRecurring: formData.isRecurring,
            })
        }
    }

    const handleDelete = (id: string) => {
        if (confirm(translations.actions.deleteConfirm)) {
            deleteMutation.mutate({ id })
        }
    }

    const handleOpenChange = (open: boolean) => {
        setIsDialogOpen(open)
        if (!open) {
            resetForm()
            setEditingHoliday(null)
        }
    }

    const sortedHolidays = [...holidays].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    return (
        <div className="flex flex-col gap-4 h-full">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{translations.title}</h2>
                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        onClick={() => generateMutation.mutate()}
                        disabled={generateMutation.isPending}
                    >
                        <Sparkles className="h-4 w-4 mr-2" />
                        {generateMutation.isPending
                            ? translations.actions.importing
                            : translations.actions.importPublicHolidays}
                    </Button>
                    <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                {translations.form.addHoliday}
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    {editingHoliday
                                        ? translations.form.editHoliday
                                        : translations.form.addHoliday}
                                </DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <Label htmlFor="date">{translations.form.date}</Label>
                                    <Input
                                        id="date"
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) =>
                                            setFormData({ ...formData, date: e.target.value })
                                        }
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="name">{translations.form.name}</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({ ...formData, name: e.target.value })
                                        }
                                        required
                                        maxLength={100}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="description">
                                        {translations.form.description}
                                    </Label>
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
                                    <Label htmlFor="isRecurring">
                                        {translations.form.recurringAnnually}
                                    </Label>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => handleOpenChange(false)}
                                    >
                                        {translations.form.cancel}
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={
                                            createMutation.isPending || updateMutation.isPending
                                        }
                                    >
                                        {editingHoliday
                                            ? translations.form.update
                                            : translations.form.create}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
            <div className="rounded-md border overflow-auto flex-1">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="min-w-[120px]">
                                {translations.table.date}
                            </TableHead>
                            <TableHead className="min-w-[200px]">
                                {translations.table.name}
                            </TableHead>
                            <TableHead className="min-w-[250px]">
                                {translations.table.description}
                            </TableHead>
                            <TableHead className="min-w-[100px]">
                                {translations.table.recurring}
                            </TableHead>
                            <TableHead className="text-right min-w-[150px]">
                                {translations.table.actions}
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedHolidays.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="text-center text-muted-foreground"
                                >
                                    {translations.table.noHolidays}
                                </TableCell>
                            </TableRow>
                        ) : (
                            sortedHolidays.map((holiday) => (
                                <TableRow key={holiday.id}>
                                    <TableCell className="whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            {new Date(holiday.date).toLocaleDateString("en-US", {
                                                year: "numeric",
                                                month: "short",
                                                day: "numeric",
                                            })}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">{holiday.name}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {holiday.description || "-"}
                                    </TableCell>
                                    <TableCell>
                                        {holiday.isRecurring ? (
                                            <span className="text-xs text-green-600">
                                                {translations.table.yes}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">
                                                {translations.table.no}
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEdit(holiday)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDelete(holiday.id)}
                                                disabled={deleteMutation.isPending}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
