"use client"

import { useEffect, useState } from "react"
import { ArrowUp } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const SHOW_AFTER_PX = 400

/** Floating button that appears after scrolling down and smooth-scrolls back to the top on click. */
export function ScrollToTopButton() {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > SHOW_AFTER_PX)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="fixed right-4 bottom-4 z-50 lg:right-6 lg:bottom-6"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                className="rounded-full shadow-lg"
                aria-label={t("common.scrollToTop")}
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                <ArrowUp />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("common.scrollToTop")}</TooltipContent>
          </Tooltip>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
