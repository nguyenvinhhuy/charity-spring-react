"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Search } from "lucide-react"
import { useTranslation } from "react-i18next"
import { PublicLayout } from "@/components/layouts/public-layout"
import { listFaqs } from "@/api/faqs"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { localized } from "@/app/campaigns/components/campaign-constants"
import { faqCategoryLabel } from "@/app/faqs/manage/components/faq-constants"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const ALL_CATEGORIES = "ALL"

/** Renders the public FAQ page: a category sidebar plus a searchable accordion of published FAQs. */
export default function FAQsPage() {
  const { t, i18n } = useTranslation()

  const [category, setCategory] = useState(ALL_CATEGORIES)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search)

  // The backend has no category filter, so filtering happens client-side below.
  const { data: faqsPage, isLoading: loading } = useQuery({
    queryKey: ["faqs", "public"],
    queryFn: () => listFaqs({ published: true, size: 200 }),
  })
  const faqs = useMemo(() => faqsPage?.content ?? [], [faqsPage])

  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    for (const faq of faqs) {
      const key = faq.category?.trim() ?? ""
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return Array.from(counts.entries()).map(([key, count]) => ({
      key,
      label: faqCategoryLabel(t, key || null),
      count,
    }))
  }, [faqs, t])

  const filteredFaqs = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase()
    return faqs.filter((faq) => {
      const faqCategoryKey = faq.category?.trim() ?? ""
      if (category !== ALL_CATEGORIES && faqCategoryKey !== category) return false
      if (!query) return true
      const question = localized(i18n.language, faq.question, faq.questionEn).toLowerCase()
      const answer = localized(i18n.language, faq.answer, faq.answerEn).toLowerCase()
      return question.includes(query) || answer.includes(query)
    })
  }, [faqs, category, debouncedSearch, i18n.language])

  const selectedLabel = category === ALL_CATEGORIES ? t("faqsPublic.allFaqs") : faqCategoryLabel(t, category || null)

  return (
    <PublicLayout title={t("faqsPublic.title")} description={t("faqsPublic.description")}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>{t("faqsPublic.categories")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("faqsPublic.searchPlaceholder")}
                className="pl-9"
              />
            </div>
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => setCategory(ALL_CATEGORIES)}
                className={cn(
                  "flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  category === ALL_CATEGORIES ? "bg-muted" : "hover:bg-muted/50",
                )}
              >
                <span>{t("faqsPublic.allFaqs")}</span>
                <span className="text-muted-foreground text-xs">{faqs.length}</span>
              </button>
              {categories.map(({ key, label, count }) => (
                <button
                  key={key || "uncategorized"}
                  type="button"
                  onClick={() => setCategory(key)}
                  className={cn(
                    "flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    category === key ? "bg-muted" : "hover:bg-muted/50",
                  )}
                >
                  <span>{label}</span>
                  <span className="text-muted-foreground text-xs">{count}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {selectedLabel}{" "}
              <span className="text-muted-foreground font-normal">
                {t("faqsPublic.total", { count: filteredFaqs.length })}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground py-10 text-center text-sm">{t("faqsPublic.loading")}</p>
            ) : filteredFaqs.length === 0 ? (
              <p className="text-muted-foreground py-10 text-center text-sm">{t("faqsPublic.empty")}</p>
            ) : (
              <Accordion type="multiple">
                {filteredFaqs.map((faq) => (
                  <AccordionItem key={faq.id} value={String(faq.id)}>
                    <AccordionTrigger>{localized(i18n.language, faq.question, faq.questionEn)}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {localized(i18n.language, faq.answer, faq.answerEn)}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  )
}
