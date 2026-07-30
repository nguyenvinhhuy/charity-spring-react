"use client"

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"
import type { ChangeEvent } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { ImagePlus, Upload } from "lucide-react"
import { uploadImage } from "@/api/media"
import { getErrorMessage } from "@/api/axios"
import { cn } from "@/lib/utils"

interface ImageUploadFieldProps {
  value: string
  /** Preview shape: "3/2" (default) for photo thumbnails, "square" for logos/emblems. */
  aspectRatio?: "3/2" | "square"
}

export interface ImageUploadHandle {
  /** Uploads the picked file (if any) and returns its URL; returns the existing value otherwise. */
  commit: () => Promise<string>
}

/**
 * A single-image upload dropzone: click anywhere to pick a file, preview it locally, and upload it
 * lazily only when the caller invokes {@link ImageUploadHandle.commit} (typically on form submit) —
 * so cancelling the form never leaves an unattached image on Cloudinary. Preview is shown at the same
 * ratio it renders at on the public site (a true WYSIWYG of the final crop, not just a small icon next
 * to a button). The "3/2" ratio crops to fill (photo thumbnails); "square" letterboxes without
 * cropping (logos/emblems, which are often non-square with a transparent background).
 *
 * @param value the currently saved image URL, or an empty string when none is set
 * @param aspectRatio the preview shape
 */
export const ImageUploadField = forwardRef<ImageUploadHandle, ImageUploadFieldProps>(function ImageUploadField(
  { value, aspectRatio = "3/2" },
  ref,
) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState("")
  const [uploading, setUploading] = useState(false)
  const isSquare = aspectRatio === "square"

  useEffect(() => {
    if (!pendingFile) {
      setPreviewUrl("")
      return
    }
    const objectUrl = URL.createObjectURL(pendingFile)
    setPreviewUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [pendingFile])

  useImperativeHandle(ref, () => ({
    async commit() {
      if (!pendingFile) return value
      setUploading(true)
      try {
        const { url } = await uploadImage(pendingFile)
        setPendingFile(null)
        return url
      } catch (err) {
        toast.error(getErrorMessage(err))
        throw err
      } finally {
        setUploading(false)
      }
    },
  }))

  function onPick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) setPendingFile(file)
    event.target.value = ""
  }

  const displayUrl = pendingFile ? previewUrl : value

  return (
    <div>
      <button
        type="button"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "group relative mx-auto flex w-full cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border-2 border-dashed text-center transition-colors",
          isSquare ? "aspect-square max-w-40" : "aspect-[3/2] max-w-xs",
          displayUrl ? "border-transparent" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
          isSquare && displayUrl && "bg-muted",
          uploading && "pointer-events-none",
        )}
      >
        {displayUrl && (
          <>
            <img
              src={displayUrl}
              alt=""
              className={cn("absolute inset-0 h-full w-full", isSquare ? "object-contain p-3" : "object-cover")}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/50 group-hover:opacity-100">
              <span className="flex items-center gap-2 text-sm font-medium text-white">
                <Upload className="size-4" />
                {t("common.changeImage")}
              </span>
            </div>
          </>
        )}

        {!displayUrl && !uploading && (
          <>
            <ImagePlus className="text-muted-foreground/50 size-8" />
            <span className="text-muted-foreground text-sm font-medium">{t("common.uploadImage")}</span>
            <span className="text-muted-foreground/70 px-4 text-xs">{t("profile.photoHint")}</span>
          </>
        )}

        {uploading && (
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center",
              displayUrl ? "bg-black/50" : "bg-transparent",
            )}
          >
            <span className={cn("text-sm font-medium", displayUrl ? "text-white" : "text-muted-foreground")}>
              {t("common.uploadingImage")}
            </span>
          </div>
        )}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onPick}
        className="hidden"
      />
    </div>
  )
})
