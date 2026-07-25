"use client"

import { useEffect, useState } from "react"
import { Link, useParams } from "react-router"
import { useTranslation } from "react-i18next"
import { ArrowLeft } from "lucide-react"
import DOMPurify from "dompurify"
import { PublicLayout } from "@/components/layouts/public-layout"
import { getPost, recordPostView } from "@/api/posts"
import { getErrorMessage } from "@/api/axios"
import { useRecordView } from "@/hooks/use-record-view"
import type { PostDetail } from "@/types"
import { localized } from "@/app/campaigns/components/campaign-constants"
import { ReactionBar } from "@/components/reaction-bar"
import { ViewCountBadge } from "@/components/view-count-badge"
import { CommentSection } from "@/components/comment-section"
import { Badge } from "@/components/ui/badge"

/**
 * Formats an ISO date string as a Vietnamese short date.
 *
 * @param iso the ISO 8601 date string
 */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN")
}

/** Renders the public news detail page: a single published post's full sanitized content. */
export default function NewsDetailPage() {
  const { t, i18n } = useTranslation()
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<PostDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    let cancelled = false

    /** Fetches the post by slug and stores it, tracking a not-found state on error. */
    async function load() {
      setLoading(true)
      setNotFound(false)
      try {
        const result = await getPost(slug as string)
        if (!cancelled) setPost(result)
      } catch (err) {
        if (!cancelled) {
          setNotFound(true)
          getErrorMessage(err)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [slug])

  useRecordView(post?.id ?? null, recordPostView)

  if (loading) {
    return (
      <PublicLayout>
        <p className="text-muted-foreground py-16 text-center">{t("news.loading")}</p>
      </PublicLayout>
    )
  }

  if (notFound || !post) {
    return (
      <PublicLayout>
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-muted-foreground">{t("news.notFound")}</p>
          <Link to="/news" className="text-primary inline-flex items-center gap-1 underline">
            <ArrowLeft className="h-4 w-4" />
            {t("news.backToList")}
          </Link>
        </div>
      </PublicLayout>
    )
  }

  const title = localized(i18n.language, post.title, post.titleEn)
  const content = localized(i18n.language, post.content, post.contentEn)
  const sanitizedContent = DOMPurify.sanitize(content)

  return (
    <PublicLayout>
      <article className="mx-auto flex max-w-3xl flex-col gap-4">
        <Link
          to="/news"
          className="text-muted-foreground hover:text-primary inline-flex w-fit items-center gap-1 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("news.backToList")}
        </Link>

        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>

        {post.thumbnailUrl && (
          <img
            src={post.thumbnailUrl}
            alt={title}
            className="aspect-[3/2] w-full rounded-lg object-cover"
          />
        )}

        <div className="flex flex-wrap items-center gap-2">
          {post.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
          <span className="text-muted-foreground text-sm">
            {t("news.publishedOn", { date: formatDate(post.publishedAt ?? post.createdAt) })}
          </span>
          <ViewCountBadge count={post.viewCount} />
        </div>

        <ReactionBar target="posts" targetId={post.id} />

        <div
          className="[&_a]:text-primary [&_a]:underline [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_img]:rounded-lg [&_li]:ml-4 [&_ol]:list-decimal [&_p]:my-3 [&_p]:leading-relaxed [&_ul]:list-disc"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />

        <CommentSection target="posts" targetId={post.id} />
      </article>
    </PublicLayout>
  )
}
