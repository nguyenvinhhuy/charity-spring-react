import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"

/** Google "G" mark. */
function GoogleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
        fill="currentColor"
      />
    </svg>
  )
}

/** Facebook "f" mark. */
function FacebookIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
        fill="currentColor"
      />
    </svg>
  )
}

/** Renders "continue with Google/Facebook" buttons that start the backend OAuth2 flow. */
export function SocialLoginButtons() {
  const { t } = useTranslation()
  return (
    <>
      <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
        <span className="bg-card text-muted-foreground relative z-10 px-2">{t("auth.orContinueWith")}</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" type="button" className="w-full cursor-pointer" asChild>
          {/* Full-page navigation to the backend authorization endpoint (proxied same-origin). */}
          <a href="/oauth2/authorization/google">
            <GoogleIcon />
            Google
          </a>
        </Button>
        <Button variant="outline" type="button" className="w-full cursor-pointer" asChild>
          <a href="/oauth2/authorization/facebook">
            <FacebookIcon />
            Facebook
          </a>
        </Button>
      </div>
    </>
  )
}
