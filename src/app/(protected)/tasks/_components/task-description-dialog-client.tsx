"use client"

import { useEffect, useRef, useCallback } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Bold, Italic, Heading2, List, ListOrdered, Link2, ImageIcon } from "lucide-react"
import { toast } from "sonner"
import { useTasksStore } from "../_stores/tasks-store"
import { useTaskDescription } from "../_hooks/use-task-description"

interface TaskDescriptionDialogClientProps {
    translations: {
        dialogTitle: string
        placeholder: string
        save: string
        saving: string
        uploadImage: string
        editTitle: string
        uploadError: string
        saveError: string
    }
}

export function TaskDescriptionDialogClient({ translations }: TaskDescriptionDialogClientProps) {
    const isOpen = useTasksStore((s) => s.descriptionDialog.isOpen)
    const taskId = useTasksStore((s) => s.descriptionDialog.taskId)
    const taskTitle = useTasksStore((s) => s.descriptionDialog.taskTitle)
    const closeDescriptionDialog = useTasksStore((s) => s.closeDescriptionDialog)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const { description, isFetching, isLoading, handleSave, handleImageUpload } =
        useTaskDescription()

    const handleImageUploadRef = useRef(handleImageUpload)
    handleImageUploadRef.current = handleImageUpload

    const taskIdRef = useRef(taskId)
    taskIdRef.current = taskId

    const editor = useEditor({
        extensions: [
            StarterKit,
            Image.configure({ inline: false, allowBase64: false }),
            Link.configure({ openOnClick: false }),
            Placeholder.configure({ placeholder: translations.placeholder }),
        ],
        editorProps: {
            attributes: {
                class: "prose prose-sm max-w-none focus:outline-none min-h-[300px] p-4 text-foreground",
            },
            handlePaste: (view, event) => {
                const items = event.clipboardData?.items
                if (!items) return false

                for (const item of Array.from(items)) {
                    if (item.type.startsWith("image/")) {
                        const file = item.getAsFile()
                        const currentTaskId = taskIdRef.current
                        if (!file || !currentTaskId) continue

                        event.preventDefault()

                        handleImageUploadRef
                            .current(file, currentTaskId)
                            .then((url) => {
                                editor?.chain().focus().setImage({ src: url }).run()
                            })
                            .catch((err) => {
                                const message =
                                    err instanceof Error ? err.message : translations.uploadError
                                toast.error(message)
                            })

                        return true
                    }
                }

                return false
            },
        },
    })

    useEffect(() => {
        if (!editor) return
        if (isFetching) return
        const incoming = description ?? ""
        if (editor.getHTML() !== incoming) {
            editor.commands.setContent(incoming)
        }
    }, [description, isFetching, editor])

    const onSave = useCallback(() => {
        if (!editor) return
        void handleSave(editor.getHTML())
    }, [editor, handleSave])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                e.preventDefault()
                onSave()
            }
        }
        if (isOpen) {
            document.addEventListener("keydown", handleKeyDown)
        }
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [isOpen, onSave])

    const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !taskId || !editor) return
        e.target.value = ""
        try {
            const url = await handleImageUpload(file, taskId)
            editor.chain().focus().setImage({ src: url }).run()
        } catch (err) {
            const message = err instanceof Error ? err.message : translations.uploadError
            toast.error(message)
        }
    }

    const setLink = () => {
        if (!editor) return
        const url = window.prompt("URL")
        if (!url) return
        editor.chain().focus().setLink({ href: url }).run()
    }

    return (
        <Dialog open={isOpen} onOpenChange={closeDescriptionDialog}>
            <DialogContent className="max-w-4xl h-[85vh] flex flex-col gap-0 p-0">
                <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-3 border-b">
                    <DialogTitle className="text-base font-semibold">
                        {taskTitle ?? translations.dialogTitle}
                    </DialogTitle>
                </DialogHeader>

                {/* Toolbar */}
                <div className="flex-shrink-0 flex flex-wrap gap-1 px-4 py-2 border-b bg-muted/40">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => editor?.chain().focus().toggleBold().run()}
                        data-active={editor?.isActive("bold")}
                        aria-label="Bold"
                    >
                        <Bold className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => editor?.chain().focus().toggleItalic().run()}
                        data-active={editor?.isActive("italic")}
                        aria-label="Italic"
                    >
                        <Italic className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                        data-active={editor?.isActive("heading", { level: 2 })}
                        aria-label="Heading"
                    >
                        <Heading2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => editor?.chain().focus().toggleBulletList().run()}
                        data-active={editor?.isActive("bulletList")}
                        aria-label="Bullet list"
                    >
                        <List className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                        data-active={editor?.isActive("orderedList")}
                        aria-label="Ordered list"
                    >
                        <ListOrdered className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={setLink}
                        data-active={editor?.isActive("link")}
                        aria-label="Link"
                    >
                        <Link2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => fileInputRef.current?.click()}
                        aria-label={translations.uploadImage}
                    >
                        <ImageIcon className="h-3.5 w-3.5" />
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        className="hidden"
                        onChange={handleImageFileChange}
                    />
                </div>

                {/* Editor area */}
                <div className="flex-1 overflow-y-auto relative">
                    {isFetching && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/60 z-10">
                            <LoadingSpinner />
                        </div>
                    )}
                    <EditorContent editor={editor} className="h-full" />
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 flex justify-end px-6 py-3 border-t">
                    <Button onClick={onSave} disabled={isLoading || isFetching} size="sm">
                        {isLoading ? translations.saving : translations.save}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
