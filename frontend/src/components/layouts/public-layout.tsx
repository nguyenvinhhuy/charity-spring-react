"use client"

import { useState, type ReactNode } from "react"
import { Link, useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import { CircleUser, LayoutDashboard, LogOut, Mail, MapPin, Menu, Phone } from "lucide-react"
import { toast } from "sonner"
import { logout } from "@/api/auth"
import { useAuthStore } from "@/store/authStore"
import type { Role } from "@/types/common"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ModeToggle } from "@/components/mode-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { ScrollToTopButton } from "@/components/scroll-to-top-button"
import { FacebookPageWidget } from "@/components/facebook-page-widget"
import { NotificationBell } from "@/components/notification-bell"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const STAFF_ROLES: Role[] = ["ADMIN", "CONTRIBUTOR"]

interface NavLinkItem {
  to: string
  labelKey: string
}

const NAV_LINKS: NavLinkItem[] = [
  { to: "/", labelKey: "nav.home" },
  { to: "/campaigns", labelKey: "nav.campaigns" },
  { to: "/news", labelKey: "nav.news" },
  { to: "/faqs", labelKey: "nav.faqs" },
  { to: "/about", labelKey: "nav.about" },
  { to: "/contact", labelKey: "nav.contact" },
]

const FACEBOOK_PAGE_URL = "https://www.facebook.com/TNHuongsen"

interface PublicLayoutProps {
  children: ReactNode
  title?: string
  description?: string
}

/**
 * Renders the public site shell: header (logo, language/theme toggles, auth-aware actions) and a
 * minimal footer, wrapping page content with an optional title/description heading.
 *
 * @param children the page content
 * @param title optional page heading
 * @param description optional supporting text shown under the title
 */
export function PublicLayout({ children, title, description }: PublicLayoutProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const member = useAuthStore((s) => s.member)
  const clear = useAuthStore((s) => s.clear)
  const isStaff = member ? STAFF_ROLES.includes(member.role) : false
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  /** Revokes the session server-side, clears local auth state, and returns to sign-in. */
  async function handleLogout() {
    try {
      await logout()
    } catch {
      // Ignore network errors: clear the client session regardless.
    }
    clear()
    setMobileMenuOpen(false)
    toast.success(t("profile.loggedOut"))
    navigate("/auth/sign-in", { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-background sticky top-0 z-40 border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 lg:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-2 font-medium">
            <Logo size={32} className="shrink-0" />
            <span className="truncate">Hương Sen</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            {NAV_LINKS.map((link) => (
              <Link key={link.to} to={link.to} className="hover:text-primary">
                {t(link.labelKey)}
              </Link>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <LanguageToggle />
            <ModeToggle />
            <NotificationBell />

            {/* Desktop-only: full auth controls (nav links + these fit fine at md and up). */}
            <div className="hidden md:block">
              {member ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="cursor-pointer">
                      <Logo size={20} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col text-sm">
                        <span className="truncate font-medium">{member.fullName}</span>
                        <span className="text-muted-foreground truncate text-xs">{member.email}</span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link to="/profile">
                        <CircleUser />
                        {t("userMenu.profile")}
                      </Link>
                    </DropdownMenuItem>
                    {isStaff && (
                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link to="/dashboard">
                          <LayoutDashboard />
                          {t("nav.dashboard")}
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
                      <LogOut />
                      {t("userMenu.logout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="outline" asChild>
                    <Link to="/auth/sign-in">{t("auth.login")}</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/auth/sign-up">{t("auth.signUp")}</Link>
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile-only: hamburger opening a Sheet with nav links + auth actions. */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden" aria-label={t("common.openMenu")}>
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="flex flex-col">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Logo size={24} />
                    <span>Hương Sen</span>
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-1 px-4">
                  {NAV_LINKS.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      className="hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-2 text-sm font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t(link.labelKey)}
                    </Link>
                  ))}
                </nav>
                <Separator className="mx-4 w-auto" />
                <div className="flex flex-col gap-2 px-4">
                  {member ? (
                    <>
                      <div className="flex flex-col px-3 text-sm">
                        <span className="truncate font-medium">{member.fullName}</span>
                        <span className="text-muted-foreground truncate text-xs">{member.email}</span>
                      </div>
                      <Button variant="ghost" className="justify-start" asChild onClick={() => setMobileMenuOpen(false)}>
                        <Link to="/profile">
                          <CircleUser />
                          {t("userMenu.profile")}
                        </Link>
                      </Button>
                      {isStaff && (
                        <Button variant="ghost" className="justify-start" asChild onClick={() => setMobileMenuOpen(false)}>
                          <Link to="/dashboard">
                            <LayoutDashboard />
                            {t("nav.dashboard")}
                          </Link>
                        </Button>
                      )}
                      <Button variant="ghost" className="justify-start" onClick={handleLogout}>
                        <LogOut />
                        {t("userMenu.logout")}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" asChild onClick={() => setMobileMenuOpen(false)}>
                        <Link to="/auth/sign-in">{t("auth.login")}</Link>
                      </Button>
                      <Button asChild onClick={() => setMobileMenuOpen(false)}>
                        <Link to="/auth/sign-up">{t("auth.signUp")}</Link>
                      </Button>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6">
          {title && (
            <div className="mb-6 flex flex-col gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              {description && <p className="text-muted-foreground">{description}</p>}
            </div>
          )}
          {children}
        </div>
      </main>

      <footer className="bg-muted/30 border-t">
        <div className="mx-auto max-w-5xl px-4 py-10 lg:px-6">
          <div className="grid gap-8 sm:grid-cols-3">
            <div className="flex flex-col items-center gap-4 text-center">
              <Link to="/" className="flex items-center gap-2 font-medium">
                <Logo size={28} />
                <span>Hương Sen</span>
              </Link>
              <p className="text-muted-foreground text-sm">{t("auth.tagline")}</p>
              <ul className="flex w-fit flex-col gap-3 text-left text-sm">
                <li className="flex items-start gap-2.5">
                  <MapPin className="text-primary mt-0.5 size-4 shrink-0" />
                  <span>{t("contactPublic.addressValue")}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Phone className="text-primary mt-0.5 size-4 shrink-0" />
                  <span>{t("contactPublic.phoneValue")}</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Mail className="text-primary mt-0.5 size-4 shrink-0" />
                  <span>{t("contactPublic.emailValue")}</span>
                </li>
              </ul>
            </div>

            <div className="sm:border-border sm:border-l sm:pl-8">
              <h3 className="text-muted-foreground mb-4 text-xs font-semibold tracking-widest uppercase">
                {t("footer.quickLinks")}
              </h3>
              <ul className="flex flex-col gap-2.5 text-sm">
                {NAV_LINKS.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="hover:text-primary transition-colors">
                      {t(link.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="sm:border-border sm:border-l sm:pl-8">
              <h3 className="text-muted-foreground mb-4 text-xs font-semibold tracking-widest uppercase">
                {t("footer.followUs")}
              </h3>
              <FacebookPageWidget pageUrl={FACEBOOK_PAGE_URL} />
            </div>
          </div>

          <Separator className="my-6" />

          <div className="flex flex-wrap items-center justify-center gap-2 text-center">
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} {t("auth.orgName")}
            </p>
            <span className="text-muted-foreground/50 text-sm">•</span>
            <p className="text-muted-foreground text-sm">{t("footer.madeWith")}</p>
          </div>
        </div>
      </footer>

      <ScrollToTopButton />
    </div>
  )
}
