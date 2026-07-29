"use client"

import { useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import { z } from "zod"
import { toast } from "sonner"
import { UserPlus } from "lucide-react"
import { createMember } from "@/api/members"
import { getErrorMessage } from "@/api/axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const PASSWORD_MIN_LENGTH = 8

/**
 * Builds the create-member zod schema with localized validation messages.
 *
 * @param t translation function
 */
function buildCreateMemberSchema(t: TFunction) {
  return z.object({
    fullName: z.string().min(1, t("users.validation.fullNameRequired")),
    email: z
      .string()
      .min(1, t("users.validation.emailRequired"))
      .pipe(z.email(t("users.validation.emailInvalid"))),
    password: z.string().min(PASSWORD_MIN_LENGTH, t("users.validation.passwordMin", { min: PASSWORD_MIN_LENGTH })),
    role: z.enum(["ADMIN", "CONTRIBUTOR", "MEMBER"]),
  })
}

type CreateMemberValues = z.infer<ReturnType<typeof buildCreateMemberSchema>>

interface CreateMemberDialogProps {
  onCreated: () => void | Promise<void>
}

/**
 * Renders the "add member" button plus its dialog form, creating a member on submit.
 *
 * @param onCreated called after a member is successfully created
 */
export function CreateMemberDialog({ onCreated }: CreateMemberDialogProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  const createMemberSchema = useMemo(() => buildCreateMemberSchema(t), [t])

  const form = useForm<CreateMemberValues>({
    resolver: zodResolver(createMemberSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      role: "MEMBER",
    },
  })

  const createMutation = useMutation({
    mutationFn: (values: CreateMemberValues) => createMember(values),
    // Awaits the refetch before closing so the table behind it never briefly shows stale data.
    onSuccess: async () => {
      toast.success(t("users.dialog.created"))
      await onCreated()
      setOpen(false)
      form.reset()
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  /**
   * Submits the validated create-member form values.
   *
   * @param values the validated create-member form values
   */
  function onSubmit(values: CreateMemberValues) {
    createMutation.mutate(values)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus />
          {t("users.addMember")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("users.dialog.title")}</DialogTitle>
          <DialogDescription>{t("users.dialog.description")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("users.dialog.fullName")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("users.dialog.fullNamePlaceholder")} autoComplete="name" {...field} />
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
                  <FormLabel>{t("users.dialog.email")}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder={t("users.dialog.emailPlaceholder")}
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
                  <FormLabel>{t("users.dialog.password")}</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("users.dialog.role")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ADMIN">{t("role.ADMIN")}</SelectItem>
                      <SelectItem value="CONTRIBUTOR">{t("role.CONTRIBUTOR")}</SelectItem>
                      <SelectItem value="MEMBER">{t("role.MEMBER")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? t("users.dialog.submitting") : t("users.dialog.submit")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
