"use client"

import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Logo } from "@/components/logo"

/**
 * Renders the forgot-password form card requesting a password reset by email.
 *
 * @param className additional classes merged onto the root div
 * @param props remaining props spread onto the root div
 */
export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { t } = useTranslation()
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex justify-center mb-2">
                <a href="/" className="flex items-center gap-2 font-medium">
                  <div className="flex size-8 items-center justify-center">
                    <Logo size={24} />
                  </div>
                  <span className="text-xl">Hương Sen</span>
                </a>
              </div>
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">{t("auth.forgotPassword")}</h1>
                <p className="text-muted-foreground text-balance">
                  {t("auth.forgotPasswordDesc")}
                </p>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </div>
              <Button type="submit" className="w-full cursor-pointer">
                {t("auth.sendResetLink")}
              </Button>
              <div className="text-center text-sm">
                {t("auth.rememberPassword")}{" "}
                <a href="/auth/sign-in" className="underline underline-offset-4">
                  {t("auth.backToSignIn")}
                </a>
              </div>
            </div>
          </form>
          <div className="bg-muted relative hidden md:block">
            <img
              src="https://ui.shadcn.com/placeholder.svg"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.95] dark:invert"
            />
          </div>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        {t("auth.termsNotice")}
      </div>
    </div>
  )
}
