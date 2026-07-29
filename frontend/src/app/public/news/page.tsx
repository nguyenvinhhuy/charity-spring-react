"use client"

import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { Search } from "lucide-react"
import { toast } from "sonner"
import { PublicLayout } from "@/components/layouts/public-layout"
import { listPosts } from "@/api/posts"
import { getErrorMessage } from "@/api/axios"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import type { PostSummary } from "@/types/post"
import { localized } from "@/app/campaigns/components/campaign-constants"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

const PAGE_SIZE = 50

/**
 * Formats an ISO date string as a Vietnamese short date.
 *
 * @param iso the ISO 8601 date string
 */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN")
}

/** Renders the public news list page: a client-side searchable grid of published posts. */
export default function NewsPage() {
  const { t, i18n } = useTranslation()
  const [posts, setPosts] = useState<PostSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search)

  useEffect(() => {
    let cancelled = false

    /** Fetches all published posts and stores them, surfacing errors as a toast. */
    async function load() {
      setLoading(true)
      try {
        const result = await listPosts({ published: true, size: PAGE_SIZE })
        if (!cancelled) setPosts(result.content)
      } catch (err) {
        if (!cancelled) toast.error(getErrorMessage(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const filteredPosts = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase()
    if (!query) return posts
    return posts.filter((post) => localized(i18n.language, post.title, post.titleEn).toLowerCase().includes(query))
  }, [posts, debouncedSearch, i18n.language])

  return (
    <PublicLayout title={t("news.title")} description={t("news.description")}>
      <div className="flex flex-col gap-6">
        <div className="relative max-w-sm">
          <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("news.searchPlaceholder")}
            className="pl-9"
          />
        </div>

        {loading ? (
          <p className="text-muted-foreground py-16 text-center">{t("news.loading")}</p>
        ) : filteredPosts.length === 0 ? (
          <p className="text-muted-foreground py-16 text-center">{t("news.empty")}</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => (
              <Link
                key={post.id}
                to={`/news/${post.slug}`}
                className="group bg-card flex flex-col overflow-hidden rounded-lg border transition-shadow hover:shadow-md"
              >
                {post.thumbnailUrl ? (
                  <img src={post.thumbnailUrl} alt="" className="aspect-[3/2] w-full object-cover" />
                ) : (
                  <div className="bg-muted aspect-[3/2] w-full" />
                )}
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <h2 className="group-hover:text-primary line-clamp-2 font-semibold">
                    {localized(i18n.language, post.title, post.titleEn)}
                  </h2>
                  {post.summary && (
                    <p className="text-muted-foreground line-clamp-2 text-sm">
                      {localized(i18n.language, post.summary, post.summaryEn)}
                    </p>
                  )}
                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
                    {post.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {formatDate(post.publishedAt ?? post.createdAt)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  )
}
