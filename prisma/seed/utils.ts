// Seeded random number generator for reproducible data
export class SeededRandom {
    private seed: number

    constructor(seed: number) {
        this.seed = seed
    }

    next(): number {
        const x = Math.sin(this.seed++) * 10000
        return x - Math.floor(x)
    }

    nextInt(min: number, max: number): number {
        return Math.floor(this.next() * (max - min + 1)) + min
    }

    choice<T>(array: T[]): T {
        return array[Math.floor(this.next() * array.length)]
    }

    shuffle<T>(array: T[]): T[] {
        const result = [...array]
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(this.next() * (i + 1))
            ;[result[i], result[j]] = [result[j], result[i]]
        }
        return result
    }
}

// Date helpers
export function isWeekday(date: Date): boolean {
    const day = date.getDay()
    return day !== 0 && day !== 6
}

export function normalizeDate(date: Date): Date {
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
}

export function addDays(date: Date, days: number): Date {
    const result = new Date(date)
    result.setUTCDate(result.getUTCDate() + days)
    return result
}

export function* dateRange(start: Date, end: Date) {
    const current = new Date(start)
    while (current <= end) {
        yield new Date(current)
        current.setUTCDate(current.getUTCDate() + 1)
    }
}

// Constants
export const FIRST_NAMES = [
    "John",
    "Emma",
    "Michael",
    "Olivia",
    "William",
    "Ava",
    "James",
    "Isabella",
    "Robert",
    "Sophia",
    "David",
    "Mia",
    "Joseph",
    "Charlotte",
    "Charles",
    "Amelia",
    "Thomas",
    "Harper",
    "Daniel",
    "Evelyn",
    "Matthew",
    "Abigail",
    "Anthony",
    "Emily",
    "Mark",
    "Elizabeth",
    "Donald",
    "Sofia",
    "Steven",
    "Avery",
    "Paul",
    "Ella",
]

export const LAST_NAMES = [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Garcia",
    "Miller",
    "Davis",
    "Rodriguez",
    "Martinez",
    "Hernandez",
    "Lopez",
    "Gonzalez",
    "Wilson",
    "Anderson",
    "Thomas",
    "Taylor",
    "Moore",
    "Jackson",
    "Martin",
    "Lee",
    "Perez",
    "Thompson",
]

export const LIST_TEMPLATES = [
    { name: "Work", color: "#3b82f6", icon: "💼", description: "Work-related tasks" },
    { name: "Personal", color: "#8b5cf6", icon: "🏠", description: "Personal tasks and projects" },
    { name: "Projects", color: "#10b981", icon: "🚀", description: "Active projects" },
    { name: "Shopping", color: "#f59e0b", icon: "🛒", description: "Shopping lists" },
    { name: "Ideas", color: "#ec4899", icon: "💡", description: "Ideas and inspiration" },
]

export const TASK_TEMPLATES = [
    "Complete project documentation",
    "Review pull requests",
    "Update API endpoints",
    "Fix production bug",
    "Implement new feature",
    "Write unit tests",
    "Refactor legacy code",
    "Database optimization",
    "Security audit",
    "Performance testing",
    "Client meeting preparation",
    "Research new technologies",
    "Code review",
    "Deploy to staging",
    "Update dependencies",
]
