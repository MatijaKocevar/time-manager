"use client"

import { ChevronRight, Home, MoreHorizontal } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useIsMobile } from "@/hooks/use-mobile"
import { useBreadcrumbContext } from "./breadcrumb-context"

interface BreadcrumbSegment {
    label: string
    href: string
    isLoading?: boolean
}

interface BreadcrumbsProps {
    overrides?: Record<string, string>
}

const UUID_REGEX = /^[a-z0-9]{20,}$/i

function isUUID(segment: string): boolean {
    return UUID_REGEX.test(segment)
}

function generateBreadcrumbsFromPath(pathname: string): BreadcrumbSegment[] {
    const segments = pathname.split("/").filter(Boolean)
    const breadcrumbs: BreadcrumbSegment[] = []

    let currentPath = ""
    for (const segment of segments) {
        currentPath += `/${segment}`

        const isId = isUUID(segment)
        const label = segment
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")

        breadcrumbs.push({
            label,
            href: currentPath,
            isLoading: isId,
        })
    }

    return breadcrumbs
}

export function Breadcrumbs({ overrides = {} }: BreadcrumbsProps) {
    const pathname = usePathname()
    const isMobile = useIsMobile()
    const { overrides: contextOverrides } = useBreadcrumbContext()

    const generated = generateBreadcrumbsFromPath(pathname)
    const allOverrides = { ...overrides, ...contextOverrides }
    const breadcrumbs = generated.map((crumb) => {
        const hasOverride = !!allOverrides[crumb.href]
        return {
            ...crumb,
            label: allOverrides[crumb.href] || crumb.label,
            isLoading: crumb.isLoading && !hasOverride,
        }
    })

    if (breadcrumbs.length === 0) {
        return null
    }

    if (breadcrumbs.length === 1) {
        return (
            <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
                <Link
                    href="/tracker"
                    className="flex items-center hover:text-foreground transition-colors"
                >
                    <Home className="h-4 w-4" />
                </Link>
                <ChevronRight className="h-4 w-4 mx-1" />
                {breadcrumbs[0].isLoading ? (
                    <Skeleton className="h-4 w-24" />
                ) : (
                    <span className="font-medium text-foreground">{breadcrumbs[0].label}</span>
                )}
            </nav>
        )
    }

    if (breadcrumbs.length === 2 && !isMobile) {
        return (
            <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
                <Link
                    href="/tracker"
                    className="flex items-center hover:text-foreground transition-colors"
                >
                    <Home className="h-4 w-4" />
                </Link>
                <ChevronRight className="h-4 w-4 mx-1" />
                {breadcrumbs[0].isLoading ? (
                    <Skeleton className="h-4 w-24" />
                ) : (
                    <Link
                        href={breadcrumbs[0].href}
                        className="hover:text-foreground transition-colors"
                    >
                        {breadcrumbs[0].label}
                    </Link>
                )}
                <ChevronRight className="h-4 w-4 mx-1" />
                {breadcrumbs[1].isLoading ? (
                    <Skeleton className="h-4 w-24" />
                ) : (
                    <span className="font-medium text-foreground">{breadcrumbs[1].label}</span>
                )}
            </nav>
        )
    }

    const middleCrumbs = isMobile ? breadcrumbs.slice(0, -1) : breadcrumbs.slice(0, -2)
    const lastCrumb = breadcrumbs[breadcrumbs.length - 1]

    if (isMobile) {
        return (
            <nav className="flex items-center text-sm text-muted-foreground">
                <Link
                    href="/tracker"
                    className="flex items-center hover:text-foreground transition-colors"
                >
                    <Home className="h-4 w-4" />
                </Link>
                <ChevronRight className="h-4 w-4 mx-1" />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 hover:bg-transparent"
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        {middleCrumbs.map((crumb, index) => (
                            <DropdownMenuItem key={index} asChild={!crumb.isLoading}>
                                {crumb.isLoading ? (
                                    <Skeleton className="h-4 w-24" />
                                ) : (
                                    <Link href={crumb.href}>{crumb.label}</Link>
                                )}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
                <ChevronRight className="h-4 w-4 mx-1" />
                {lastCrumb.isLoading ? (
                    <Skeleton className="h-4 w-24" />
                ) : (
                    <span className="font-medium text-foreground">{lastCrumb.label}</span>
                )}
            </nav>
        )
    }

    const previousCrumb = breadcrumbs[breadcrumbs.length - 2]

    return (
        <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
            <Link
                href="/tracker"
                className="flex items-center hover:text-foreground transition-colors"
            >
                <Home className="h-4 w-4" />
            </Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-auto p-0 hover:bg-transparent">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    {middleCrumbs.map((crumb, index) => (
                        <DropdownMenuItem key={index} asChild={!crumb.isLoading}>
                            {crumb.isLoading ? (
                                <Skeleton className="h-4 w-24" />
                            ) : (
                                <Link href={crumb.href}>{crumb.label}</Link>
                            )}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
            <ChevronRight className="h-4 w-4 mx-1" />
            {previousCrumb.isLoading ? (
                <Skeleton className="h-4 w-24" />
            ) : (
                <Link href={previousCrumb.href} className="hover:text-foreground transition-colors">
                    {previousCrumb.label}
                </Link>
            )}
            <ChevronRight className="h-4 w-4 mx-1" />
            {lastCrumb.isLoading ? (
                <Skeleton className="h-4 w-24" />
            ) : (
                <span className="font-medium text-foreground">{lastCrumb.label}</span>
            )}
        </nav>
    )
}
