"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { Newspaper } from "lucide-react"
import { listPosts } from "@/api/posts"
import type { PostSummary } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { localized } from "@/app/campaigns/components/campaign-constants"

const LATEST_COUNT = 3

/** Formats an ISO date string as a short localized date. */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN")
}

/** Renders up to 3 published posts as a preview grid on the home page, linking to the public news list/detail. */
export function HomeLatestNews() {
  const { t, i18n } = useTranslation()
  const [posts, setPosts] = useState<PostSummary[]>([])

  useEffect(() => {
    let active = true
    listPosts({ published: true, size: LATEST_COUNT })
      .then((result) => {
        if (active) setPosts(result.content)
      })
      .catch(() => {
        // Non-critical decorative section: fail silently.
      })
    return () => {
      active = false
    }
  }, [])

  if (posts.length === 0) return null

  return (
    <section className="border-t bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-16 lg:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge variant="outline" className="mb-3 flex w-fit items-center gap-2">
              <Newspaper className="size-3" />
              {t("home.latestNewsBadge")}
            </Badge>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("home.latestNewsTitle")}</h2>
          </div>
          <Button variant="ghost" asChild>
            <Link to="/news">{t("home.viewAll")}</Link>
          </Button>
        </div>
        <div className="divide-border/70 flex flex-col divide-y">
          {posts.map((post) => (
            <Link
              key={post.id}
              to={`/news/${post.slug}`}
              className="group flex items-center gap-5 py-6 first:pt-0 last:pb-0"
            >
              <div className="bg-muted h-20 w-28 shrink-0 overflow-hidden rounded-lg sm:h-24 sm:w-36">
                {post.thumbnailUrl ? (
                  <img
                    src={post.thumbnailUrl}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Newspaper className="text-muted-foreground/40 size-8" />
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <p className="text-muted-foreground text-xs">{formatDate(post.publishedAt ?? post.createdAt)}</p>
                <h3 className="group-hover:text-primary line-clamp-1 font-semibold transition-colors">
                  {localized(i18n.language, post.title, post.titleEn)}
                </h3>
                {post.summary && (
                  <p className="text-muted-foreground line-clamp-2 text-sm">
                    {localized(i18n.language, post.summary, post.summaryEn)}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
