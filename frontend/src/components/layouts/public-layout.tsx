"use client"

import type { ReactNode } from "react"
import { Link, useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import { CircleUser, LayoutDashboard, LogOut } from "lucide-react"
import { toast } from "sonner"
import { logout } from "@/api/auth"
import { useAuthStore } from "@/store/authStore"
import type { Role } from "@/types"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const STAFF_ROLES: Role[] = ["ADMIN", "CONTRIBUTOR"]

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

  /** Revokes the session server-side, clears local auth state, and returns to sign-in. */
  async function handleLogout() {
    try {
      await logout()
    } catch {
      // Ignore network errors: clear the client session regardless.
    }
    clear()
    toast.success(t("profile.loggedOut"))
    navigate("/auth/sign-in", { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-background sticky top-0 z-40 border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 lg:px-6">
          <Link to="/" className="flex items-center gap-2 font-medium">
            <Logo size={32} />
            <span>Hương Sen</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            <Link to="/" className="hover:text-primary">
              {t("nav.home")}
            </Link>
            <Link to="/campaigns" className="hover:text-primary">
              {t("nav.campaigns")}
            </Link>
            <Link to="/news" className="hover:text-primary">
              {t("nav.news")}
            </Link>
            <Link to="/faqs" className="hover:text-primary">
              {t("nav.faqs")}
            </Link>
            <Link to="/about" className="hover:text-primary">
              {t("nav.about")}
            </Link>
            <Link to="/contact" className="hover:text-primary">
              {t("nav.contact")}
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ModeToggle />
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
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-8 text-center lg:px-6">
          <div className="flex items-center gap-2">
            <Logo size={24} />
            <span className="font-medium">{t("auth.orgName")}</span>
          </div>
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} {t("auth.orgName")}
          </p>
        </div>
      </footer>
    </div>
  )
}
