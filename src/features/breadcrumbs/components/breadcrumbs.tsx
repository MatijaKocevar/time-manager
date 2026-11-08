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

function HomeLink() {
    return (
        <Link
            href="/tracker"
            className="flex shrink-0 items-center hover:text-foreground transition-colors"
        >
            <Home className="h-4 w-4" />
        </Link>
    )
}

function CrumbMenu({ crumbs }: { crumbs: BreadcrumbSegment[] }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-auto p-0 hover:bg-transparent">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                {crumbs.map((crumb, index) => (
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
    )
}

function CrumbSkeletonOrLabel({ crumb }: { crumb: BreadcrumbSegment }) {
    if (crumb.isLoading) {
        return <Skeleton className="h-4 w-24" />
    }

    return <span className="font-medium text-foreground truncate">{crumb.label}</span>
}

export function Breadcrumbs({ overrides = {} }: BreadcrumbsProps) {
    const pathname = usePathname()
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
            <nav className="flex min-w-0 items-center space-x-1 text-sm text-muted-foreground">
                <HomeLink />
                <ChevronRight className="h-4 w-4 mx-1 shrink-0" />
                <CrumbSkeletonOrLabel crumb={breadcrumbs[0]} />
            </nav>
        )
    }

    const lastCrumb = breadcrumbs[breadcrumbs.length - 1]
    const previousCrumb = breadcrumbs[breadcrumbs.length - 2]
    const mobileMiddleCrumbs = breadcrumbs.slice(0, -1)
    const desktopMiddleCrumbs = breadcrumbs.slice(0, -2)

    return (
        <>
            <nav className="flex min-w-0 items-center text-sm text-muted-foreground md:hidden">
                <HomeLink />
                <ChevronRight className="h-4 w-4 mx-1 shrink-0" />
                <CrumbMenu crumbs={mobileMiddleCrumbs} />
                <ChevronRight className="h-4 w-4 mx-1 shrink-0" />
                <CrumbSkeletonOrLabel crumb={lastCrumb} />
            </nav>

            {breadcrumbs.length === 2 ? (
                <nav className="hidden min-w-0 items-center space-x-1 text-sm text-muted-foreground md:flex">
                    <HomeLink />
                    <ChevronRight className="h-4 w-4 mx-1 shrink-0" />
                    {breadcrumbs[0].isLoading ? (
                        <Skeleton className="h-4 w-24" />
                    ) : (
                        <Link
                            href={breadcrumbs[0].href}
                            className="hover:text-foreground transition-colors truncate"
                        >
                            {breadcrumbs[0].label}
                        </Link>
                    )}
                    <ChevronRight className="h-4 w-4 mx-1 shrink-0" />
                    <CrumbSkeletonOrLabel crumb={lastCrumb} />
                </nav>
            ) : (
                <nav className="hidden min-w-0 items-center space-x-1 text-sm text-muted-foreground md:flex">
                    <HomeLink />
                    <ChevronRight className="h-4 w-4 mx-1 shrink-0" />
                    <CrumbMenu crumbs={desktopMiddleCrumbs} />
                    <ChevronRight className="h-4 w-4 mx-1 shrink-0" />
                    {previousCrumb.isLoading ? (
                        <Skeleton className="h-4 w-24" />
                    ) : (
                        <Link
                            href={previousCrumb.href}
                            className="hover:text-foreground transition-colors truncate"
                        >
                            {previousCrumb.label}
                        </Link>
                    )}
                    <ChevronRight className="h-4 w-4 mx-1 shrink-0" />
                    <CrumbSkeletonOrLabel crumb={lastCrumb} />
                </nav>
            )}
        </>
    )
}
