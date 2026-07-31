"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useTheme } from "@/hooks/use-theme"
import { useCircularTransition } from "@/hooks/use-circular-transition"
import "./theme-customizer/circular-transition.css"

interface ModeToggleProps {
  variant?: "outline" | "ghost" | "default"
}

/**
 * Renders a button that toggles between light and dark mode with a circular reveal transition.
 *
 * @param variant the button's visual style
 */
export function ModeToggle({ variant = "outline" }: ModeToggleProps) {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { toggleTheme } = useCircularTransition()

  // Simple, reliable dark mode detection with re-sync
  const [isDarkMode, setIsDarkMode] = React.useState(false)

  React.useEffect(() => {
    const updateMode = () => {
      if (theme === "dark") {
        setIsDarkMode(true)
      } else if (theme === "light") {
        setIsDarkMode(false)
      } else {
        setIsDarkMode(window.matchMedia("(prefers-color-scheme: dark)").matches)
      }
    }

    updateMode()

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    mediaQuery.addEventListener("change", updateMode)

    return () => mediaQuery.removeEventListener("change", updateMode)
  }, [theme])

  /** Triggers the circular theme-toggle transition anchored at the click position. */
  const handleToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    toggleTheme(event)
  }

  const toggleLabel = isDarkMode ? t("common.switchToLightMode") : t("common.switchToDarkMode")

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={variant}
          size="icon"
          onClick={handleToggle}
          aria-label={toggleLabel}
          className="cursor-pointer mode-toggle-button relative overflow-hidden"
        >
          {/* Show the icon for the mode you can switch TO */}
          {isDarkMode ? (
            <Sun className="h-[1.2rem] w-[1.2rem] transition-transform duration-300 rotate-0 scale-100" />
          ) : (
            <Moon className="h-[1.2rem] w-[1.2rem] transition-transform duration-300 rotate-0 scale-100" />
          )}
          <span className="sr-only">{toggleLabel}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{toggleLabel}</TooltipContent>
    </Tooltip>
  )
}
