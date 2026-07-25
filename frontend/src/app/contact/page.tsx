"use client"

import { useTranslation } from "react-i18next"
import { Mail, MapPin, Phone } from "lucide-react"
import { PublicLayout } from "@/components/layouts/public-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ContactForm } from "./components/contact-form"

/** Renders the public Contact page: static contact info cards alongside a contact form. */
export default function ContactPage() {
  const { t } = useTranslation()

  return (
    <PublicLayout title={t("contactPublic.title")} description={t("contactPublic.description")}>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>{t("contactPublic.infoTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                <div>
                  <p className="font-medium">{t("contactPublic.addressLabel")}</p>
                  <p className="text-muted-foreground">{t("contactPublic.addressValue")}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                <div>
                  <p className="font-medium">{t("contactPublic.phoneLabel")}</p>
                  <p className="text-muted-foreground">{t("contactPublic.phoneValue")}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                <div>
                  <p className="font-medium">{t("contactPublic.emailLabel")}</p>
                  <p className="text-muted-foreground">{t("contactPublic.emailValue")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("contactPublic.formTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ContactForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </PublicLayout>
  )
}
