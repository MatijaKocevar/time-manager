import { Clock } from "lucide-react"
import { useTranslations } from "next-intl"

interface AppLogoProps {
    size?: "sm" | "md" | "lg"
    showText?: boolean
    className?: string
}

export function AppLogo({ size = "md", showText = true, className = "" }: AppLogoProps) {
    const t = useTranslations("metadata")

    const sizeClasses = {
        sm: "h-6 w-6",
        md: "h-8 w-8",
        lg: "h-10 w-10",
    }

    const iconSizes = {
        sm: "h-3 w-3",
        md: "h-4 w-4",
        lg: "h-5 w-5",
    }

    const textSizes = {
        sm: "text-xs",
        md: "text-sm",
        lg: "text-base",
    }

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div
                className={`flex ${sizeClasses[size]} items-center justify-center rounded-lg text-white shadow-md`}
                style={{
                    background: "linear-gradient(to bottom right, #3b82f6, #9333ea)",
                }}
            >
                <Clock className={iconSizes[size]} strokeWidth={2.5} />
            </div>
            {showText && (
                <div className="flex flex-col leading-tight">
                    <span className={`font-bold tracking-tight ${textSizes[size]}`}>
                        {t("title")}
                    </span>
                    <span className="text-xs text-muted-foreground">{t("company")}</span>
                </div>
            )}
        </div>
    )
}
