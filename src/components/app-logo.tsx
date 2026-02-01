import Image from "next/image"
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

    const textSizes = {
        sm: "text-xs",
        md: "text-sm",
        lg: "text-base",
    }

    const imgSizes = {
        sm: 24,
        md: 32,
        lg: 40,
    }

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div className={`flex ${sizeClasses[size]} items-center justify-center`}>
                <Image
                    src="/logo.svg"
                    alt="Time Manager Logo"
                    width={imgSizes[size]}
                    height={imgSizes[size]}
                    priority
                />
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
