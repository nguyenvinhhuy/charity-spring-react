"use client"

import { useEffect } from "react"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { Bold, Heading2, Italic, List, ListOrdered } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
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
  const { t } = useTranslation()
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
  }, [value, editor])

  if (!editor) return null

  return (
    <div className={cn("rounded-md border", className)}>
      <div className="flex flex-wrap items-center gap-1 border-b p-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant={editor.isActive("bold") ? "secondary" : "ghost"}
              className="size-8"
              aria-label={t("richTextEditor.bold")}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <Bold className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("richTextEditor.bold")}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant={editor.isActive("italic") ? "secondary" : "ghost"}
              className="size-8"
              aria-label={t("richTextEditor.italic")}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <Italic className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("richTextEditor.italic")}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant={editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"}
              className="size-8"
              aria-label={t("richTextEditor.heading")}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            >
              <Heading2 className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("richTextEditor.heading")}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
              className="size-8"
              aria-label={t("richTextEditor.bulletList")}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              <List className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("richTextEditor.bulletList")}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
              className="size-8"
              aria-label={t("richTextEditor.numberedList")}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
              <ListOrdered className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("richTextEditor.numberedList")}</TooltipContent>
        </Tooltip>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
