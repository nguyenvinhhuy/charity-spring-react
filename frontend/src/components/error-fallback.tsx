"use client"

import { Button } from "@/components/ui/button"

/** Friendly fallback UI shown by ErrorBoundary when a component crashes during render. */
export function ErrorFallback() {
  return (
    <div className="mx-auto flex min-h-dvh flex-col items-center justify-center gap-8 p-8 text-center md:gap-12 md:p-16">
      <div>
        <h1 className="mb-4 text-3xl font-bold">Đã xảy ra lỗi</h1>
        <p className="text-muted-foreground">
          Ứng dụng gặp sự cố ngoài dự kiến. Vui lòng tải lại trang; nếu vẫn lỗi, hãy báo cho quản trị viên.
        </p>
        <div className="mt-6 flex items-center justify-center gap-4 md:mt-8">
          <Button onClick={() => window.location.assign("/dashboard")}>Về trang chủ</Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Tải lại trang
          </Button>
        </div>
      </div>
    </div>
  )
}
