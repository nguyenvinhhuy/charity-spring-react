"use client"

import { Link } from "react-router"
import { Megaphone, Users } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"

/** Renders shortcut buttons linking to the campaign and user management pages. */
export function QuickActions() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button asChild>
        <Link to="/campaigns">
          <Megaphone className="size-4" />
          {t("dashboard.quickActions.createCampaign")}
        </Link>
      </Button>
      <Button variant="outline" asChild>
        <Link to="/users">
          <Users className="size-4" />
          {t("dashboard.quickActions.manageUsers")}
        </Link>
      </Button>
    </div>
  )
}
