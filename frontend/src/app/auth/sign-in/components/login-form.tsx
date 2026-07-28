import { useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import type { TFunction } from "i18next"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router"
import { z } from "zod"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { login } from "@/api/auth"
import { getErrorMessage } from "@/api/axios"
import { useAuthStore } from "@/store/authStore"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Logo } from "@/components/logo"
import { SocialLoginButtons } from "@/components/social-login-buttons"

function buildLoginFormSchema(t: TFunction) {
  return z.object({
    email: z.string().min(1, t("auth.validation.emailRequired")).pipe(z.email(t("auth.validation.emailInvalid"))),
    password: z.string().min(1, t("auth.validation.passwordRequired")),
  })
}

type LoginFormValues = z.infer<ReturnType<typeof buildLoginFormSchema>>

/**
 * Renders the sign-in form card, authenticating the member and redirecting to the dashboard.
 *
 * @param className additional classes merged onto the root div
 * @param props remaining props spread onto the root div
 */
export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const loginFormSchema = useMemo(() => buildLoginFormSchema(t), [t])

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "" },
  })

  /**
   * Submits credentials, stores the session, and redirects to the dashboard.
   *
   * @param values the validated login form values
   */
  async function onSubmit(values: LoginFormValues) {
    try {
      const res = await login(values)
      setAuth(res.accessToken, res.member)
      toast.success(t("auth.loginSuccess", { name: res.member.fullName }))
      const isStaff = res.member.role === "ADMIN" || res.member.role === "CONTRIBUTOR"
      navigate(isStaff ? "/dashboard" : "/")
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <Form {...form}>
            <form className="p-6 md:p-8" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-6">
                <div className="mb-2 flex justify-center">
                  <Link to="/" className="flex items-center gap-2 font-medium">
                    <div className="flex size-8 items-center justify-center">
                      <Logo size={24} />
                    </div>
                    <span className="text-xl">Hương Sen</span>
                  </Link>
                </div>
                <div className="flex flex-col items-center text-center">
                  <h1 className="text-2xl font-bold">{t("auth.welcomeBack")}</h1>
                  <p className="text-muted-foreground text-balance">
                    {t("auth.loginSubtitle")}
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("auth.email")}</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="ban@email.com"
                          autoComplete="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center">
                        <FormLabel>{t("auth.password")}</FormLabel>
                        <Link
                          to="/auth/forgot-password"
                          className="ml-auto text-sm underline-offset-2 hover:underline"
                        >
                          {t("auth.forgotPassword")}
                        </Link>
                      </div>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete="current-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full cursor-pointer"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? t("auth.loggingIn") : t("auth.login")}
                </Button>

                <SocialLoginButtons />

                <div className="text-center text-sm">
                  {t("auth.noAccount")}{" "}
                  <Link
                    to="/auth/sign-up"
                    className="underline underline-offset-4"
                  >
                    {t("auth.signUp")}
                  </Link>
                </div>
              </div>
            </form>
          </Form>

          <div className="from-primary/15 to-primary/5 relative hidden flex-col items-center justify-center gap-4 bg-gradient-to-br p-8 md:flex">
            <Logo size={72} />
            <div className="text-center">
              <p className="text-lg font-semibold">{t("auth.orgName")}</p>
              <p className="text-muted-foreground text-sm text-balance">
                {t("auth.tagline")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        {t("auth.termsNotice")}
      </div>
    </div>
  )
}
