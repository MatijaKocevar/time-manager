import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { QUICK_ACTIONS } from "../constants"

interface QuickActionsProps {
    translations: {
        title: string
        description: string
        manageUsers: string
        viewPendingRequests: string
        manageShifts: string
        viewRequestHistory: string
    }
}

export function QuickActions({ translations }: QuickActionsProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{translations.title}</CardTitle>
                <CardDescription>{translations.description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                    {QUICK_ACTIONS.map(({ labelKey, href }) => (
                        <Button key={labelKey} variant="outline" asChild className="justify-between">
                            <Link href={href}>
                                {translations[labelKey]}
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
