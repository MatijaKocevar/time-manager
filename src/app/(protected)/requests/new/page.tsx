"use client"

import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createRequest } from "../actions/request-actions"
import { requestKeys } from "../query-keys"
import { REQUEST_TYPES, REQUEST_TYPE } from "../constants"
import { useRequestStore } from "../stores/request-store"
import { type RequestType } from "../schemas/request-schemas"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

export default function NewRequestPage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const formData = useRequestStore((state) => state.formData)
    const setFormData = useRequestStore((state) => state.setFormData)
    const resetForm = useRequestStore((state) => state.resetForm)

    const mutation = useMutation({
        mutationFn: createRequest,
        onSuccess: (result) => {
            if (result.success) {
                queryClient.invalidateQueries({ queryKey: requestKeys.all })
                resetForm()
                router.push("/requests")
            }
        },
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.type || !formData.startDate || !formData.endDate) return

        mutation.mutate({
            type: formData.type as RequestType,
            startDate: formData.startDate,
            endDate: formData.endDate,
            reason: formData.reason,
            location: formData.type === REQUEST_TYPE.REMOTE_WORK ? formData.location : undefined,
        })
    }

    const needsLocation = formData.type === REQUEST_TYPE.REMOTE_WORK

    return (
        <div className="space-y-4">
            <Card>
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="type">Type</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(value) =>
                                    setFormData({ type: value as RequestType })
                                }
                            >
                                <SelectTrigger id="type">
                                    <SelectValue placeholder="Select request type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {REQUEST_TYPES.map((rt) => (
                                        <SelectItem key={rt.value} value={rt.value}>
                                            {rt.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startDate">Start Date</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ startDate: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endDate">End Date</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ endDate: e.target.value })}
                                />
                            </div>
                        </div>

                        {needsLocation && (
                            <div className="space-y-2">
                                <Label htmlFor="location">Location</Label>
                                <Input
                                    id="location"
                                    type="text"
                                    placeholder="Enter location"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ location: e.target.value })}
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="reason">Reason (optional)</Label>
                            <Input
                                id="reason"
                                type="text"
                                placeholder="Enter reason"
                                value={formData.reason}
                                onChange={(e) => setFormData({ reason: e.target.value })}
                            />
                        </div>

                        {mutation.data?.error && (
                            <div className="text-sm text-red-600">{mutation.data.error}</div>
                        )}

                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push("/requests")}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={mutation.isPending}>
                                {mutation.isPending ? "Creating..." : "Create Request"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
