import * as React from "react"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { ThemeProviderContext } from "@/contexts/theme-context"

const Toaster = ({ ...props }: ToasterProps) => {
  // Use the app's own theme context (not next-themes, which pulls a duplicate React).
  const { theme = "system" } = React.useContext(ThemeProviderContext)

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
