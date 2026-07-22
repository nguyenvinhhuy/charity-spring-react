import * as React from "react"
import { ThemeProviderContext } from "@/contexts/theme-context"

/** Reads the current theme context, throwing if used outside a ThemeProvider. */
export const useTheme = () => {
  const context = React.useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
