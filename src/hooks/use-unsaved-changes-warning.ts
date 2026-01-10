import { useEffect } from "react"

export function useUnsavedChangesWarning(
    isDirty: boolean,
    isSaving: boolean,
    unsavedMessage: string
) {
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault()
                e.returnValue = ""
            }
        }

        const handleRouteChange = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            const link = target.closest("a")

            if (link && isDirty && !isSaving) {
                const href = link.getAttribute("href")
                if (href && !href.startsWith("#") && href !== window.location.pathname) {
                    if (!confirm(unsavedMessage)) {
                        e.preventDefault()
                        e.stopPropagation()
                    }
                }
            }
        }

        window.addEventListener("beforeunload", handleBeforeUnload)
        document.addEventListener("click", handleRouteChange, true)

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload)
            document.removeEventListener("click", handleRouteChange, true)
        }
    }, [isDirty, isSaving, unsavedMessage])
}
