import { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import { getMe, refresh } from "@/api/auth"
import { useAuthStore } from "@/store/authStore"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

/** Completes social login: the backend has set the refresh cookie, so exchange it for a session. */
export default function AuthCallbackPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const setAccessToken = useAuthStore((s) => s.setAccessToken)
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return
    done.current = true

    async function completeLogin() {
      try {
        const { accessToken } = await refresh()
        setAccessToken(accessToken)
        const member = await getMe()
        setAuth(accessToken, member)
        toast.success(t("auth.loginSuccess", { name: member.fullName }))
        navigate("/dashboard", { replace: true })
      } catch {
        toast.error(t("auth.socialFailed"))
        navigate("/auth/sign-in", { replace: true })
      }
    }

    void completeLogin()
  }, [navigate, setAuth, setAccessToken])

  return (
    <div className="flex min-h-svh items-center justify-center">
      <LoadingSpinner />
    </div>
  )
}
