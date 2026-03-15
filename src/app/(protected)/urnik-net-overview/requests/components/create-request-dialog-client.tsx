"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RequestTypeSelector } from "./request-type-selector"
import { CreateRequestForm } from "./create-request-form"
import { CreateDayRequestForm } from "./create-day-request-form"
import { useCreateRequestStore } from "../stores/create-request-store"

interface CreateRequestDialogClientProps {
    dialogTitle: string
    typeLabel: string
    typePlaceholder: string
    typeWork: string
    typeWorkFromHome: string
    dateLabel: string
    startTimeLabel: string
    endTimeLabel: string
    commentLabel: string
    submitButton: string
    successMessage: string
    errorPrefix: string
    retryButton: string
    startDateLabel: string
    endDateLabel: string
    workDaysLabel: string
    typeVacation: string
    typeSickLeave: string
    typeDayWorkFromHome: string
}

export function CreateRequestDialogClient({
    dialogTitle,
    typeLabel,
    typePlaceholder,
    typeWork,
    typeWorkFromHome,
    dateLabel,
    startTimeLabel,
    endTimeLabel,
    commentLabel,
    submitButton,
    successMessage,
    errorPrefix,
    retryButton,
    startDateLabel,
    endDateLabel,
    workDaysLabel,
    typeVacation,
    typeSickLeave,
    typeDayWorkFromHome,
}: CreateRequestDialogClientProps) {
    const isDialogOpen = useCreateRequestStore((state) => state.isDialogOpen)
    const closeDialog = useCreateRequestStore((state) => state.closeDialog)
    const requestCategory = useCreateRequestStore((state) => state.requestCategory)

    return (
        <Dialog open={isDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle>{dialogTitle}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    {requestCategory === "HOUR" && (
                        <>
                            <RequestTypeSelector
                                label={typeLabel}
                                placeholder={typePlaceholder}
                                typeWork={typeWork}
                                typeWorkFromHome={typeWorkFromHome}
                            />
                            <CreateRequestForm
                                dateLabel={dateLabel}
                                startTimeLabel={startTimeLabel}
                                endTimeLabel={endTimeLabel}
                                commentLabel={commentLabel}
                                submitButton={submitButton}
                                successMessage={successMessage}
                                errorPrefix={errorPrefix}
                                retryButton={retryButton}
                            />
                        </>
                    )}
                    {requestCategory === "DAY" && (
                        <CreateDayRequestForm
                            startDateLabel={startDateLabel}
                            endDateLabel={endDateLabel}
                            workDaysLabel={workDaysLabel}
                            commentLabel={commentLabel}
                            submitButton={submitButton}
                            successMessage={successMessage}
                            errorPrefix={errorPrefix}
                            retryButton={retryButton}
                            typeVacation={typeVacation}
                            typeSickLeave={typeSickLeave}
                            typeWorkFromHome={typeDayWorkFromHome}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
