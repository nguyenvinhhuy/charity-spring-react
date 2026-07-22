import * as React from "react"
import { SidebarContext, type SidebarContextValue } from "@/contexts/sidebar-context"

/** Reads the sidebar configuration context, throwing if used outside its provider. */
export function useSidebarConfig(): SidebarContextValue {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebarConfig must be used within a SidebarConfigProvider")
  }
  return context
}
