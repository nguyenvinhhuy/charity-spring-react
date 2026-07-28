"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Handshake } from "lucide-react"
import { motion } from "motion/react"
import { listPartners } from "@/api/partners"
import type { Partner } from "@/types/partner"
import { Badge } from "@/components/ui/badge"
import { fadeInUp, revealOnce } from "@/lib/motion"

/** Renders one partner as a card: round logo mark plus name, linking out to its website when set. */
function PartnerLogo({ partner }: { partner: Partner }) {
  const content = (
    <div className="flex shrink-0 items-center gap-3 rounded-xl p-4 transition-all hover:z-10 hover:scale-105 hover:bg-card hover:shadow-[0_0_18px_rgba(0,0,0,0.15)]">
      <div className="bg-muted flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full">
        <img src={partner.logoUrl} alt="" className="size-full object-contain" />
      </div>
      <span className="text-foreground text-sm font-medium whitespace-nowrap">{partner.name}</span>
    </div>
  )
  if (!partner.websiteUrl) return content
  return (
    <a href={partner.websiteUrl} target="_blank" rel="noopener noreferrer">
      {content}
    </a>
  )
}

/** Renders the home page's "co-organizing units" logo strip, fetched from the public partners endpoint. */
export function HomePartners() {
  const { t } = useTranslation()
  const [partners, setPartners] = useState<Partner[]>([])

  useEffect(() => {
    let active = true
    listPartners()
      .then((result) => {
        if (active) setPartners(result)
      })
      .catch(() => {
        // Non-critical decorative section: fail silently.
      })
    return () => {
      active = false
    }
  }, [])

  if (partners.length === 0) return null

  return (
    <section className="border-t bg-muted/30 py-16 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 lg:px-6">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <Badge variant="outline" className="mb-3 flex w-fit items-center gap-2 mx-auto">
            <Handshake className="size-3" />
            {t("home.partnersBadge")}
          </Badge>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("home.partnersTitle")}</h2>
        </div>
      </div>

      <motion.div
        className="partners-fade-mask overflow-hidden"
        initial="hidden"
        whileInView="show"
        viewport={revealOnce}
        variants={fadeInUp}
      >
        <div className="animate-partners-scroll flex w-max gap-6 py-4">
          {[...partners, ...partners].map((partner, index) => (
            <PartnerLogo key={`${partner.id}-${index}`} partner={partner} />
          ))}
        </div>
      </motion.div>
    </section>
  )
}
