"use client"

import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageToggle } from "@/components/language-toggle"

interface SettingsMenuProps {
    translations: {
        settings: string
        language: string
        theme: string
    }
}

export function SettingsMenu({ translations }: SettingsMenuProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Settings className="h-5 w-5" />
                    <span className="sr-only">{translations.settings}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>{translations.settings}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 flex items-center justify-between">
                    <span className="text-sm">{translations.language}</span>
                    <LanguageToggle />
                </div>
                <div className="px-2 py-1.5 flex items-center justify-between">
                    <span className="text-sm">{translations.theme}</span>
                    <ThemeToggle />
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
