"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Calendar,
  CircleUser,
  Handshake,
  Home,
  ListChecks,
  Mail,
  Newspaper,
  Settings,
  Users,
  HeartHandshake,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { useAuthStore } from "@/store/authStore"
import { Logo } from "@/components/logo"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

/** Renders the app's primary sidebar with role-aware navigation groups and the current user's menu. */
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t } = useTranslation()
  const role = useAuthStore((s) => s.member?.role)
  const isAdmin = role === "ADMIN"
  const canManageCampaigns = role === "ADMIN" || role === "CONTRIBUTOR"

  const data = {
    user: {
      name: "Hương Sen",
      email: "store@example.com",
      avatar: "",
    },
    navGroups: [
      {
        label: "Dashboards",
        items: [
          {
            title: t("nav.dashboard"),
            url: "/dashboard",
            icon: LayoutDashboard,
          },
        ],
      },
      {
        label: "Apps",
        items: [
          ...(canManageCampaigns
            ? [
                {
                  title: t("nav.campaigns"),
                  url: "/dashboard/campaigns",
                  icon: HeartHandshake,
                },
              ]
            : []),
          ...(canManageCampaigns
            ? [
                {
                  title: t("nav.calendar"),
                  url: "/dashboard/calendar",
                  icon: Calendar,
                },
              ]
            : []),
          ...(isAdmin
            ? [
                {
                  title: t("nav.users"),
                  url: "/dashboard/users",
                  icon: Users,
                },
              ]
            : []),
          ...(canManageCampaigns
            ? [
                {
                  title: t("nav.faqManage"),
                  url: "/dashboard/faqs",
                  icon: ListChecks,
                },
              ]
            : []),
          ...(canManageCampaigns
            ? [
                {
                  title: t("nav.newsManage"),
                  url: "/dashboard/news",
                  icon: Newspaper,
                },
              ]
            : []),
          ...(canManageCampaigns
            ? [
                {
                  title: t("nav.inquiriesManage"),
                  url: "/dashboard/inquiries",
                  icon: Mail,
                },
              ]
            : []),
          ...(canManageCampaigns
            ? [
                {
                  title: t("nav.partnersManage"),
                  url: "/dashboard/partners",
                  icon: Handshake,
                },
              ]
            : []),
          ...(isAdmin
            ? [
                {
                  title: t("nav.settings"),
                  url: "/dashboard/settings",
                  icon: Settings,
                },
              ]
            : []),
        ],
      },
      {
        label: "Pages",
        items: [
          {
            title: t("nav.home"),
            url: "/",
            icon: Home,
            openInNewTab: true,
          },
          {
            title: t("nav.profile"),
            url: "/profile",
            icon: CircleUser,
          },
        ],
      },
    ],
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center">
                  <Logo size={32} />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Hương Sen</span>
                  <span className="truncate text-xs">Admin Dashboard</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {data.navGroups.map((group) => (
          <NavMain key={group.label} label={group.label} items={group.items} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
