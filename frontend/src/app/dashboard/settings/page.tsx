"use client"

import { useEffect, useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"
import type { TFunction } from "i18next"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { toast } from "sonner"
import { BaseLayout } from "@/components/layouts/base-layout"
import { getBankSettings, updateBankSettings } from "@/api/settings"
import { getErrorMessage } from "@/api/axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

/**
 * Builds the bank settings form's zod schema with localized validation messages.
 *
 * @param t the translation function
 */
function buildBankSettingsSchema(t: TFunction) {
  return z.object({
    bankAccountNo: z.string().min(1, t("settings.bank.accountNoRequired")),
    bankAccountName: z.string().min(1, t("settings.bank.accountNameRequired")),
  })
}

type BankSettingsFormValues = z.infer<ReturnType<typeof buildBankSettingsSchema>>

export default function SettingsPage() {
  const { t } = useTranslation()
  const bankSettingsSchema = useMemo(() => buildBankSettingsSchema(t), [t])

  const form = useForm<BankSettingsFormValues>({
    resolver: zodResolver(bankSettingsSchema),
    defaultValues: { bankAccountNo: "", bankAccountName: "" },
  })

  const bankSettingsQuery = useQuery({
    queryKey: ["settings", "bank"],
    queryFn: getBankSettings,
  })
  const loading = bankSettingsQuery.isLoading

  useEffect(() => {
    if (bankSettingsQuery.data) form.reset(bankSettingsQuery.data)
    // `form` is stable across renders; only re-sync when freshly fetched data arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bankSettingsQuery.data])

  /**
   * Saves the default bank account settings.
   *
   * @param values the validated form values
   */
  async function onSubmit(values: BankSettingsFormValues) {
    try {
      const updated = await updateBankSettings(values)
      form.reset(updated)
      toast.success(t("settings.bank.saved"))
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <BaseLayout title={t("settings.pageTitle")} description={t("settings.pageDescription")}>
      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.bank.cardTitle")}</CardTitle>
            <CardDescription>{t("settings.bank.cardDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-muted-foreground py-6 text-center text-sm">{t("common.loading")}</div>
            ) : (
              <Form {...form}>
                <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="bankAccountNo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("settings.bank.accountNoLabel")}</FormLabel>
                          <FormControl>
                            <Input placeholder={t("settings.bank.accountNoPlaceholder")} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bankAccountName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("settings.bank.accountNameLabel")}</FormLabel>
                          <FormControl>
                            <Input placeholder={t("settings.bank.accountNamePlaceholder")} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                      {form.formState.isSubmitting ? t("common.saving") : t("settings.bank.save")}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </BaseLayout>
  )
}
