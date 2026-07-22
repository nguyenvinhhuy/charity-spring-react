"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { createFaq, updateFaq } from "@/api/faqs"
import { getErrorMessage } from "@/api/axios"
import type { CreateFaqRequest, Faq } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface FaqFormValues {
  question: string
  answer: string
  questionEn: string
  answerEn: string
  category: string
  sortOrder: string
}

const EMPTY_VALUES: FaqFormValues = {
  question: "",
  answer: "",
  questionEn: "",
  answerEn: "",
  category: "",
  sortOrder: "0",
}

/** Maps a fetched FAQ into the flat form values. */
function faqToValues(faq: Faq): FaqFormValues {
  return {
    question: faq.question,
    answer: faq.answer,
    questionEn: faq.questionEn ?? "",
    answerEn: faq.answerEn ?? "",
    category: faq.category ?? "",
    sortOrder: String(faq.sortOrder),
  }
}

/** Turns an empty string into null, keeping non-empty strings as-is. */
function orNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

interface FaqFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When set, the dialog edits this FAQ; otherwise it creates a new one. */
  faq?: Faq | null
  onSaved: () => void
}

/**
 * Dialog form for creating a new FAQ or editing an existing one.
 *
 * @param open whether the dialog is visible
 * @param onOpenChange invoked when the dialog's open state should change
 * @param faq when set, the dialog edits this FAQ; otherwise it creates a new one
 * @param onSaved invoked after a successful create or update
 */
export function FaqFormDialog({ open, onOpenChange, faq, onSaved }: FaqFormDialogProps) {
  const { t } = useTranslation()
  const isEdit = Boolean(faq)
  const [values, setValues] = useState<FaqFormValues>(EMPTY_VALUES)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setValues(faq ? faqToValues(faq) : EMPTY_VALUES)
  }, [open, faq])

  /** Validates the form and submits the create or update request. */
  async function handleSave() {
    if (!values.question.trim()) {
      toast.error(t("faqManage.form.questionRequired"))
      return
    }
    if (!values.answer.trim()) {
      toast.error(t("faqManage.form.answerRequired"))
      return
    }
    const payload: CreateFaqRequest = {
      question: values.question.trim(),
      answer: values.answer.trim(),
      questionEn: orNull(values.questionEn),
      answerEn: orNull(values.answerEn),
      category: orNull(values.category),
      sortOrder: Number(values.sortOrder) || 0,
    }

    setSaving(true)
    try {
      if (faq) {
        await updateFaq(faq.id, payload)
        toast.success(t("faqManage.toast.updated"))
      } else {
        await createFaq(payload)
        toast.success(t("faqManage.toast.created"))
      }
      onOpenChange(false)
      onSaved()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("faqManage.form.editTitle") : t("faqManage.addQuestion")}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? t("faqManage.form.editDescription")
              : t("faqManage.form.createDescription")}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="vi">
          <TabsList className="w-full">
            <TabsTrigger value="vi">{t("faqManage.form.tabVi")}</TabsTrigger>
            <TabsTrigger value="en">{t("faqManage.form.tabEn")}</TabsTrigger>
          </TabsList>

          <TabsContent value="vi" className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>{t("faqManage.form.question")}</Label>
              <Input
                value={values.question}
                onChange={(e) => setValues((v) => ({ ...v, question: e.target.value }))}
                placeholder={t("faqManage.form.questionPlaceholder")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("faqManage.form.answer")}</Label>
              <Textarea
                rows={4}
                value={values.answer}
                onChange={(e) => setValues((v) => ({ ...v, answer: e.target.value }))}
                placeholder={t("faqManage.form.answerPlaceholder")}
              />
            </div>
          </TabsContent>

          <TabsContent value="en" className="mt-4 flex flex-col gap-4">
            <p className="text-muted-foreground text-xs">
              {t("faqManage.form.enHint")}
            </p>
            <div className="flex flex-col gap-1.5">
              <Label>{t("faqManage.form.question")}</Label>
              <Input
                value={values.questionEn}
                onChange={(e) => setValues((v) => ({ ...v, questionEn: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("faqManage.form.answer")}</Label>
              <Textarea
                rows={4}
                value={values.answerEn}
                onChange={(e) => setValues((v) => ({ ...v, answerEn: e.target.value }))}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>{t("faqManage.form.category")}</Label>
            <Input
              value={values.category}
              onChange={(e) => setValues((v) => ({ ...v, category: e.target.value }))}
              placeholder={t("faqManage.form.categoryPlaceholder")}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("faqManage.form.sortOrder")}</Label>
            <Input
              type="number"
              value={values.sortOrder}
              onChange={(e) => setValues((v) => ({ ...v, sortOrder: e.target.value }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("faqManage.cancel")}
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? t("faqManage.form.saving") : isEdit ? t("faqManage.form.save") : t("faqManage.addQuestion")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
