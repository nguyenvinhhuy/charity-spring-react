"use client"

import { useRef, useState } from "react"
import type { ChangeEvent } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { ImagePlus, Upload } from "lucide-react"
import { uploadImage } from "@/api/media"
import { getErrorMessage } from "@/api/axios"
import { cn } from "@/lib/utils"

interface ImageUploadFieldProps {
  value: string
  onChange: (url: string) => void
  /** Preview shape: "3/2" (default) for photo thumbnails, "square" for logos/emblems. */
  aspectRatio?: "3/2" | "square"
}

/**
 * A single-image upload dropzone: click anywhere to pick a file, upload it via the shared media
 * API, and preview it at the same ratio it renders at on the public site (so the preview is a
 * true WYSIWYG of the final crop, not just a small icon next to a button). The "3/2" ratio crops
 * to fill (photo thumbnails); "square" letterboxes without cropping (logos/emblems, which are
 * often non-square with a transparent background and must not be cut off).
 *
 * @param value the current image URL, or an empty string when none is set
 * @param onChange called with the newly uploaded image's URL
 * @param aspectRatio the preview shape
 */
export function ImageUploadField({ value, onChange, aspectRatio = "3/2" }: ImageUploadFieldProps) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const isSquare = aspectRatio === "square"

  /** Uploads the picked file and reports its URL back to the caller. */
  async function onPick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const { url } = await uploadImage(file)
      onChange(url)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <div>
      <button
        type="button"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "group relative mx-auto flex w-full cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border-2 border-dashed text-center transition-colors",
          isSquare ? "aspect-square max-w-40" : "aspect-[3/2] max-w-xs",
          value
            ? "border-transparent"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
          isSquare && value && "bg-muted",
          uploading && "pointer-events-none"
        )}
      >
        {value && (
          <>
            <img
              src={value}
              alt=""
              className={cn(
                "absolute inset-0 h-full w-full",
                isSquare ? "object-contain p-3" : "object-cover"
              )}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/50 group-hover:opacity-100">
              <span className="flex items-center gap-2 text-sm font-medium text-white">
                <Upload className="size-4" />
                {t("common.changeImage")}
              </span>
            </div>
          </>
        )}

        {!value && !uploading && (
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
              value ? "bg-black/50" : "bg-transparent"
            )}
          >
            <span className={cn("text-sm font-medium", value ? "text-white" : "text-muted-foreground")}>
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
}
