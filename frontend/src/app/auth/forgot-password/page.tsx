import { ForgotPasswordForm } from "./components/forgot-password-form"

/** Renders the forgot-password page layout wrapping the reset request form. */
export default function ForgotPasswordPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <ForgotPasswordForm />
      </div>
    </div>
  )
}
