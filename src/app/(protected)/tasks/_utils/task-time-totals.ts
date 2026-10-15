type TaskTimeTotalsNode = {
    id: string
    parentId: string | null
    directTime: number
    totalTime: number
}

export function applyTaskTotalTimes<T extends TaskTimeTotalsNode>(tasks: T[]) {
    const taskIds = new Set(tasks.map((task) => task.id))
    const childrenByParentId = new Map<string, T[]>()

    tasks.forEach((task) => {
        if (!task.parentId || !taskIds.has(task.parentId)) return

        const siblings = childrenByParentId.get(task.parentId)

        if (siblings) {
            siblings.push(task)
        } else {
            childrenByParentId.set(task.parentId, [task])
        }
    })

    const totals = new Map<string, number>(tasks.map((task) => [task.id, task.directTime]))
    const roots = tasks.filter((task) => !task.parentId || !taskIds.has(task.parentId))
    const stack = roots.map((task) => ({ task, isFinalize: false }))

    while (stack.length > 0) {
        const frame = stack.pop()

        if (!frame) break

        if (!frame.isFinalize) {
            stack.push({ task: frame.task, isFinalize: true })

            const children = childrenByParentId.get(frame.task.id)

            if (children) {
                children.forEach((child) => stack.push({ task: child, isFinalize: false }))
            }

            continue
        }

        const children = childrenByParentId.get(frame.task.id)
        const childTotal = children
            ? children.reduce((sum, child) => sum + (totals.get(child.id) ?? 0), 0)
            : 0
        const total = frame.task.directTime + childTotal

        totals.set(frame.task.id, total)
        frame.task.totalTime = total
    }
}
