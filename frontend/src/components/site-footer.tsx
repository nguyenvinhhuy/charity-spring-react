import { Heart } from "lucide-react"
import { useTranslation } from "react-i18next"

/** Renders the admin dashboard's global footer with attribution branding. */
export function SiteFooter() {
  const { t } = useTranslation()

  return (
    <footer className="border-t bg-background">
      <div className="px-4 py-6 lg:px-6">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Heart className="h-4 w-4 fill-red-500 text-red-500" />
          <span>{t("footer.madeWith")}</span>
        </div>
      </div>
    </footer>
  )
}
