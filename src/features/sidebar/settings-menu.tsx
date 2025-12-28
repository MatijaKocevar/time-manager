"use client"

import { Settings, UserCircle, LogOut, Languages, Palette, Check } from "lucide-react"
import { useLocale } from "next-intl"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useThemeStore } from "@/stores/theme-store"
import { signOut } from "next-auth/react"
import { locales, localeNames, type Locale } from "@/i18n/config"

interface SettingsMenuProps {
    translations: {
        settings: string
        language: string
        theme: string
        profile: string
        logout: string
    }
}

export function SettingsMenu({ translations }: SettingsMenuProps) {
    const locale = useLocale() as Locale
    const router = useRouter()
    const theme = useThemeStore((state) => state.theme)
    const setTheme = useThemeStore((state) => state.setTheme)

    const handleLocaleChange = async (newLocale: Locale) => {
        const response = await fetch("/api/set-locale", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ locale: newLocale }),
        })
        if (response.ok) {
            router.refresh()
        }
    }

    const themeOptions = [
        { value: "light" as const, label: "Light" },
        { value: "dark" as const, label: "Dark" },
    ]

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Settings className="h-5 w-5" />
                    <span className="sr-only">{translations.settings}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <Languages className="mr-2 h-4 w-4" />
                        <span>{translations.language}</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        {locales.map((loc) => (
                            <DropdownMenuItem key={loc} onClick={() => handleLocaleChange(loc)}>
                                <Check
                                    className={`mr-2 h-4 w-4 ${
                                        locale === loc ? "opacity-100" : "opacity-0"
                                    }`}
                                />
                                {localeNames[loc]}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <Palette className="mr-2 h-4 w-4" />
                        <span>{translations.theme}</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        {themeOptions.map((option) => (
                            <DropdownMenuItem
                                key={option.value}
                                onClick={() => setTheme(option.value)}
                            >
                                <Check
                                    className={`mr-2 h-4 w-4 ${
                                        theme === option.value ? "opacity-100" : "opacity-0"
                                    }`}
                                />
                                {option.label}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuItem onClick={() => router.push("/profile")}>
                    <UserCircle className="mr-2 h-4 w-4" />
                    <span>{translations.profile}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{translations.logout}</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
