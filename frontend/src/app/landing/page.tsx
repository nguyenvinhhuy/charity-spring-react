"use client"

import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { ArrowRight, HandHeart, HeartHandshake, ShieldCheck, Sparkles, Users } from "lucide-react"
import { motion } from "motion/react"
import { PublicLayout } from "@/components/layouts/public-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { DotPattern } from "@/components/dot-pattern"
import { Logo } from "@/components/logo"
import { fadeInUp, revealOnce, staggerChildren } from "@/lib/motion"
import { HomeStats } from "./components/home-stats"
import { HomeHowItWorks } from "./components/home-how-it-works"
import { HomeFeaturedCampaigns } from "./components/home-featured-campaigns"
import { HomeLatestNews } from "./components/home-latest-news"
import { HomePartners } from "./components/home-partners"

/** Renders the public home page: hero, donation totals, featured campaigns, latest news, and a closing CTA. */
export default function LandingPage() {
  const { t } = useTranslation()

  return (
    <PublicLayout>
      <section className="relative -mx-4 overflow-hidden bg-gradient-to-b from-background to-background/80 pt-8 pb-16 lg:-mx-6">
        <div className="absolute inset-0">
          <DotPattern className="opacity-100" size="md" fadeStyle="ellipse" />
        </div>

        <motion.div
          className="relative mx-auto max-w-4xl px-4 text-center lg:px-6"
          initial="hidden"
          animate="show"
          variants={staggerChildren}
        >
          <motion.div variants={fadeInUp} className="mb-8 flex justify-center">
            <Badge variant="outline" className="border-foreground px-4 py-2">
              <HeartHandshake className="mr-2 h-3 w-3" />
              {t("auth.orgName")}
            </Badge>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-6xl"
          >
            {t("auth.tagline")}
          </motion.h1>

          <motion.p variants={fadeInUp} className="text-muted-foreground mx-auto mb-10 max-w-2xl text-lg sm:text-xl">
            {t("home.heroSubtitle")}
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" className="text-base" asChild>
              <Link to="/campaigns">
                <HeartHandshake />
                {t("home.heroCtaCampaigns")}
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="text-base" asChild>
              <Link to="/auth/sign-up">
                <Users />
                {t("home.heroCtaJoin")}
              </Link>
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          className="relative mx-auto mt-16 max-w-lg px-4 lg:px-6"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
        >
          <div className="group relative">
            <div className="absolute top-1/2 left-1/2 h-40 w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/40 blur-3xl" />
            <div className="relative flex items-center justify-center rounded-xl border bg-card py-14 shadow-2xl">
              <Logo size={96} />
            </div>
          </div>
        </motion.div>
      </section>

      <HomeStats />
      <HomeHowItWorks />
      <HomeFeaturedCampaigns />
      <HomeLatestNews />
      <HomePartners />

      <section className="border-t bg-muted/80 py-16 lg:py-24">
        <motion.div
          className="mx-auto max-w-3xl px-4 text-center lg:px-6"
          initial="hidden"
          whileInView="show"
          viewport={revealOnce}
          variants={staggerChildren}
        >
          <motion.div variants={fadeInUp} className="mb-6 flex flex-col items-center gap-4">
            <Badge variant="outline" className="flex items-center gap-2">
              <Sparkles className="size-3" />
              {t("home.ctaBadge")}
            </Badge>
          </motion.div>

          <motion.h2 variants={fadeInUp} className="mb-4 text-3xl font-bold tracking-tight text-balance sm:text-5xl">
            {t("home.ctaTitle")}
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="text-muted-foreground mx-auto mb-8 max-w-2xl text-balance lg:text-lg"
          >
            {t("home.ctaSubtitle")}
          </motion.p>

          <motion.div variants={fadeInUp}>
            <Button size="lg" className="px-8 py-6 text-lg font-medium" asChild>
              <Link to="/auth/sign-up">
                {t("home.ctaButton")}
                <ArrowRight />
              </Link>
            </Button>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            className="text-muted-foreground mt-8 flex flex-wrap items-center justify-center gap-4 text-sm sm:gap-6"
          >
            <span className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
              {t("home.trustTransparent")}
            </span>
            <Separator orientation="vertical" className="!h-4" />
            <span className="flex items-center gap-2">
              <HandHeart className="size-4 text-primary" />
              {t("home.trustCommunity")}
            </span>
          </motion.div>
        </motion.div>
      </section>
    </PublicLayout>
  )
}
