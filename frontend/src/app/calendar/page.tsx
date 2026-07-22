import { useTranslation } from "react-i18next"
import { BaseLayout } from "@/components/layouts/base-layout"
import { Calendar } from "./components/calendar"

/** Renders the internal calendar: campaign activity dates and internal events (ADMIN, CONTRIBUTOR). */
export default function CalendarPage() {
  const { t } = useTranslation()
  return (
    <BaseLayout title={t("calendar.pageTitle")} description={t("calendar.pageDescription")}>
      <div className="px-4 lg:px-6">
        <Calendar />
      </div>
    </BaseLayout>
  )
}
