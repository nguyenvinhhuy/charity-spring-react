import { useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import type { TFunction } from "i18next"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router"
import { z } from "zod"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { registerAccount } from "@/api/auth"
import { getErrorMessage } from "@/api/axios"
import { useAuthStore } from "@/store/authStore"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
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

function buildSignupFormSchema(t: TFunction) {
  return z
    .object({
      fullName: z.string().min(1, t("auth.validation.fullNameRequired")),
      email: z.string().min(1, t("auth.validation.emailRequired")).pipe(z.email(t("auth.validation.emailInvalid"))),
      password: z.string().min(8, t("auth.validation.passwordMin", { min: 8 })),
      confirmPassword: z.string().min(1, t("auth.validation.confirmPasswordRequired")),
      terms: z.boolean().refine((v) => v, t("auth.validation.termsRequired")),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("auth.validation.passwordMismatch"),
      path: ["confirmPassword"],
    })
}

type SignupFormValues = z.infer<ReturnType<typeof buildSignupFormSchema>>

/**
 * Renders the sign-up form card, registering a MEMBER account and redirecting to the dashboard.
 *
 * @param className additional classes merged onto the root div
 * @param props remaining props spread onto the root div
 */
export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const signupFormSchema = useMemo(() => buildSignupFormSchema(t), [t])

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  })

  /**
   * Registers a MEMBER account, stores the session, and redirects to the dashboard.
   *
   * @param values the validated signup form values
   */
  async function onSubmit(values: SignupFormValues) {
    try {
      const res = await registerAccount({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
      })
      setAuth(res.accessToken, res.member)
      toast.success(t("auth.signupSuccess"))
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
                  <h1 className="text-2xl font-bold">{t("auth.createAccount")}</h1>
                  <p className="text-muted-foreground text-balance">
                    {t("auth.signupSubtitle")}
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("auth.fullName")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("profile.fullNamePlaceholder")} autoComplete="name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                      <FormLabel>{t("auth.password")}</FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="new-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("auth.confirmPassword")}</FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="new-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="terms"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-1">
                      <div className="flex items-start space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="mt-0.5"
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">
                          {t("auth.agreeTerms")}
                        </FormLabel>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full cursor-pointer"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? t("auth.creating") : t("auth.createAccount")}
                </Button>

                <SocialLoginButtons />

                <div className="text-center text-sm">
                  {t("auth.haveAccount")}{" "}
                  <Link
                    to="/auth/sign-in"
                    className="underline underline-offset-4"
                  >
                    {t("auth.login")}
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
                {t("auth.taglineSignup")}
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
