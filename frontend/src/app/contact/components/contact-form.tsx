"use client"

import { useMemo, useRef } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import type { TFunction } from "i18next"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { toast } from "sonner"
import { submitInquiry } from "@/api/inquiries"
import { getErrorMessage } from "@/api/axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

/**
 * Builds the contact form's zod schema with localized validation messages.
 *
 * @param t the translation function
 */
function buildContactSchema(t: TFunction) {
  return z.object({
    fullName: z.string().min(1, t("contactPublic.form.fullNameRequired")),
    email: z.string().email(t("contactPublic.form.emailInvalid")),
    subject: z.string().min(1, t("contactPublic.form.subjectRequired")),
    message: z.string().min(1, t("contactPublic.form.messageRequired")),
    // Honeypot: never shown to real users; a bot that autofills every input trips this.
    website: z.string().optional(),
  })
}

type ContactFormValues = z.infer<ReturnType<typeof buildContactSchema>>

const EMPTY_VALUES: ContactFormValues = {
  fullName: "",
  email: "",
  subject: "",
  message: "",
  website: "",
}

/** Renders the public contact form, submitting to the Inquiry API with honeypot + time-trap anti-spam fields. */
export function ContactForm() {
  const { t } = useTranslation()
  const contactSchema = useMemo(() => buildContactSchema(t), [t])
  const formRenderedAtMs = useRef(Date.now())

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: EMPTY_VALUES,
  })

  /**
   * Submits the form to the Inquiry API, resetting on success.
   *
   * @param values the validated form values
   */
  async function onSubmit(values: ContactFormValues) {
    try {
      await submitInquiry({
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        subject: values.subject.trim(),
        message: values.message.trim(),
        website: values.website,
        formRenderedAtMs: formRenderedAtMs.current,
      })
      toast.success(t("contactPublic.form.success"))
      form.reset(EMPTY_VALUES)
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <Form {...form}>
      <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("contactPublic.form.fullNameLabel")}</FormLabel>
              <FormControl>
                <Input {...field} />
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
              <FormLabel>{t("contactPublic.form.emailLabel")}</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("contactPublic.form.subjectLabel")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("contactPublic.form.messageLabel")}</FormLabel>
              <FormControl>
                <Textarea rows={5} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Honeypot: hidden from real users, positioned off-screen so no visual/label is needed. */}
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute -left-[9999px]"
          {...form.register("website")}
        />

        <Button type="submit" disabled={form.formState.isSubmitting} className="w-fit">
          {form.formState.isSubmitting ? t("contactPublic.form.sending") : t("contactPublic.form.submitButton")}
        </Button>
      </form>
    </Form>
  )
}
