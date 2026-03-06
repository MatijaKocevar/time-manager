import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

interface NoCredentialsAlertProps {
    translations: {
        title: string
        noCredentialsTitle: string
        noCredentialsDescription: string
        profileLink: string
    }
}

export function NoCredentialsAlert({ translations }: NoCredentialsAlertProps) {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{translations.title}</h1>
            </div>
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{translations.noCredentialsTitle}</AlertTitle>
                <AlertDescription>
                    {translations.noCredentialsDescription}{" "}
                    <Link href="/profile" className="underline">
                        {translations.profileLink}
                    </Link>
                </AlertDescription>
            </Alert>
        </div>
    )
}
