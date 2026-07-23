"use client"

import { useEffect } from "react"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { Bold, Heading2, Italic, List, ListOrdered } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  className?: string
}

/**
 * Renders a minimal Tiptap-based WYSIWYG editor (bold/italic/heading/lists) that behaves like a
 * controlled text input, emitting sanitized-at-render HTML on every change.
 *
 * @param value the current HTML content
 * @param onChange called with the new HTML content on every edit
 * @param className optional classes applied to the editor's outer wrapper
 */
export function RichTextEditor({ value, onChange, className }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    editorProps: {
      attributes: {
        class:
          "min-h-32 px-3 py-2 text-sm focus:outline-none [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_h2]:text-lg [&_h2]:font-semibold",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  // Keep the editor in sync when `value` changes externally (e.g. form.reset on open-for-edit),
  // without fighting the user's own typing (Tiptap already ignores no-op setContent calls).
  useEffect(() => {
    if (!editor) return
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || "", false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor])

  if (!editor) return null

  return (
    <div className={cn("rounded-md border", className)}>
      <div className="flex flex-wrap items-center gap-1 border-b p-1">
        <Button
          type="button"
          size="icon"
          variant={editor.isActive("bold") ? "secondary" : "ghost"}
          className="size-8"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant={editor.isActive("italic") ? "secondary" : "ghost"}
          className="size-8"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant={editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"}
          className="size-8"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
          className="size-8"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
          className="size-8"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="size-4" />
        </Button>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
