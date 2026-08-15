"use client"

import * as React from "react"
import { useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import { Command as CommandPrimitive } from "cmdk"
import { Search, HeartHandshake, LayoutDashboard, Calendar, User, type LucideIcon } from "lucide-react"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

function Command({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof CommandPrimitive> & {
  ref?: React.Ref<React.ElementRef<typeof CommandPrimitive>>
}) {
  return (
    <CommandPrimitive
      ref={ref}
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-xl bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-50",
        className,
      )}
      {...props}
    />
  )
}

function CommandInput({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input> & {
  ref?: React.Ref<React.ElementRef<typeof CommandPrimitive.Input>>
}) {
  return (
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        "flex h-12 w-full border-none bg-transparent px-4 py-3 text-[17px] outline-none placeholder:text-zinc-500 dark:placeholder:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 mb-4",
        className,
      )}
      {...props}
    />
  )
}

function CommandList({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof CommandPrimitive.List> & {
  ref?: React.Ref<React.ElementRef<typeof CommandPrimitive.List>>
}) {
  return (
    <CommandPrimitive.List
      ref={ref}
      className={cn("max-h-[400px] overflow-y-auto overflow-x-hidden pb-2", className)}
      {...props}
    />
  )
}

function CommandEmpty({
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty> & {
  ref?: React.Ref<React.ElementRef<typeof CommandPrimitive.Empty>>
}) {
  return (
    <CommandPrimitive.Empty
      ref={ref}
      className="flex h-12 items-center justify-center text-sm text-zinc-500 dark:text-zinc-400"
      {...props}
    />
  )
}

function CommandGroup({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group> & {
  ref?: React.Ref<React.ElementRef<typeof CommandPrimitive.Group>>
}) {
  return (
    <CommandPrimitive.Group
      ref={ref}
      className={cn(
        "overflow-hidden px-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-zinc-500 dark:[&_[cmdk-group-heading]]:text-zinc-400 [&:not(:first-child)]:mt-2",
        className,
      )}
      {...props}
    />
  )
}

function CommandItem({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item> & {
  ref?: React.Ref<React.ElementRef<typeof CommandPrimitive.Item>>
}) {
  return (
    <CommandPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex h-12 cursor-pointer select-none items-center gap-2 rounded-lg px-4 text-sm text-zinc-700 dark:text-zinc-300 outline-none transition-colors data-[disabled=true]:pointer-events-none data-[selected=true]:bg-zinc-100 dark:data-[selected=true]:bg-zinc-800 data-[selected=true]:text-zinc-900 dark:data-[selected=true]:text-zinc-100 data-[disabled=true]:opacity-50 [&+[cmdk-item]]:mt-1",
        className,
      )}
      {...props}
    />
  )
}

interface SearchItem {
  title: string
  url: string
  group: string
  icon?: LucideIcon
}

interface CommandSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Renders the (Ctrl/Cmd+K) command palette dialog for quick navigation across the app.
 *
 * @param open whether the dialog is currently visible
 * @param onOpenChange callback invoked when the dialog's open state should change
 */
export function CommandSearch({ open, onOpenChange }: CommandSearchProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const commandRef = React.useRef<HTMLDivElement>(null)

  const searchItems: SearchItem[] = [
    // Dashboards
    { title: t("command.dashboard"), url: "/dashboard", group: t("command.group.dashboards"), icon: LayoutDashboard },

    // Apps
    {
      title: t("command.campaigns"),
      url: "/dashboard/campaigns",
      group: t("command.group.apps"),
      icon: HeartHandshake,
    },
    { title: t("command.calendar"), url: "/dashboard/calendar", group: t("command.group.apps"), icon: Calendar },

    // Profile
    { title: t("command.profile"), url: "/profile", group: t("command.group.settings"), icon: User },
  ]

  const groupedItems = searchItems.reduce(
    (acc, item) => {
      if (!acc[item.group]) {
        acc[item.group] = []
      }
      acc[item.group].push(item)
      return acc
    },
    {} as Record<string, SearchItem[]>,
  )

  /**
   * Navigates to the selected result, closes the dialog, and plays a small bounce feedback animation.
   *
   * @param url the destination route to navigate to
   */
  const handleSelect = (url: string) => {
    navigate(url)
    onOpenChange(false)
    // Bounce effect like Vercel
    if (commandRef.current) {
      commandRef.current.style.transform = "scale(0.96)"
      setTimeout(() => {
        if (commandRef.current) {
          commandRef.current.style.transform = ""
        }
      }, 100)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 shadow-2xl border border-zinc-200 dark:border-zinc-800 max-w-[640px]">
        <DialogTitle className="sr-only">{t("command.title")}</DialogTitle>
        <Command ref={commandRef} className="transition-transform duration-100 ease-out">
          <CommandInput placeholder={t("command.placeholder")} autoFocus />
          <CommandList>
            <CommandEmpty>{t("command.noResults")}</CommandEmpty>
            {Object.entries(groupedItems).map(([group, items]) => (
              <CommandGroup key={group} heading={group}>
                {items.map((item) => {
                  const Icon = item.icon
                  return (
                    <CommandItem key={item.url} value={item.title} onSelect={() => handleSelect(item.url)}>
                      {Icon && <Icon className="mr-2 h-4 w-4" />}
                      {item.title}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Renders the header button that opens the command search dialog.
 *
 * @param onClick callback invoked when the trigger is clicked
 */
export function SearchTrigger({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation()
  return (
    <button
      onClick={onClick}
      className="inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-3 py-1 relative w-full justify-start text-muted-foreground sm:pr-12 md:w-36 lg:w-56"
    >
      <Search className="mr-2 h-3.5 w-3.5" />
      <span className="hidden lg:inline-flex">{t("command.searchButton")}</span>
      <span className="inline-flex lg:hidden">{t("command.searchButton")}</span>
      <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-4 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
        <span className="text-xs">⌘</span>K
      </kbd>
    </button>
  )
}
