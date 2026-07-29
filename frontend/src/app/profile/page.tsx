"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import type { TFunction } from "i18next"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import { toast } from "sonner"
import { Upload } from "lucide-react"
import { changeMyPassword, getMe, updateMyProfile } from "@/api/auth"
import { uploadImage } from "@/api/media"
import { getErrorMessage } from "@/api/axios"
import { getNotificationPreferences, updateNotificationPreferences } from "@/api/notifications"
import { useAuthStore } from "@/store/authStore"
import { PublicLayout } from "@/components/layouts/public-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Logo } from "@/components/logo"
import type { NotificationPreference, NotificationType } from "@/types/notification"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

function buildProfileSchema(t: TFunction) {
  return z.object({
    fullName: z.string().min(1, t("auth.validation.fullNameRequired")),
    phone: z.string().optional(),
    bio: z.string().optional(),
    dateOfBirth: z.string().optional(),
    address: z.string().optional(),
    nationalId: z
      .string()
      .optional()
      .refine((v) => !v || /^\d{12}$/.test(v), t("profile.validation.nationalIdFormat")),
  })
}
type ProfileValues = z.infer<ReturnType<typeof buildProfileSchema>>

function buildPasswordSchema(t: TFunction) {
  return z
    .object({
      currentPassword: z.string().min(1, t("profile.validation.currentPasswordRequired")),
      newPassword: z.string().min(8, t("profile.validation.newPasswordMin", { min: 8 })),
      confirmPassword: z.string().min(1, t("auth.validation.confirmPasswordRequired")),
    })
    .refine((d) => d.newPassword === d.confirmPassword, {
      message: t("auth.validation.passwordMismatch"),
      path: ["confirmPassword"],
    })
}
type PasswordValues = z.infer<ReturnType<typeof buildPasswordSchema>>

const NOTIFICATION_TYPES: NotificationType[] = [
  "COMMENT_MENTION",
  "CAMPAIGN_STATUS_CHANGED",
  "REGISTRATION_CREATED",
  "REGISTRATION_CANCELLED",
  "REGISTRATION_REMOVED",
  "DONATION_RECEIVED",
  "INQUIRY_RECEIVED",
  "BROADCAST",
]

/** Renders the profile settings page: personal info form, avatar upload, and change-password form. */
export default function ProfileSettingsPage() {
  const { t } = useTranslation()
  const member = useAuthStore((s) => s.member)
  const setMember = useAuthStore((s) => s.setMember)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(member?.avatarUrl ?? null)
  const [uploading, setUploading] = useState(false)
  const profileSchema = useMemo(() => buildProfileSchema(t), [t])
  const passwordSchema = useMemo(() => buildPasswordSchema(t), [t])
  const [preferences, setPreferences] = useState<NotificationPreference[]>([])
  const [savingType, setSavingType] = useState<NotificationType | null>(null)

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: "", phone: "", bio: "", dateOfBirth: "", address: "", nationalId: "" },
  })
  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  })

  // Refresh the profile from the server on mount, then fill the form.
  useEffect(() => {
    let active = true
    getMe()
      .then((fresh) => {
        if (!active) return
        setMember(fresh)
        setAvatarUrl(fresh.avatarUrl)
        profileForm.reset({
          fullName: fresh.fullName,
          phone: fresh.phone ?? "",
          bio: fresh.bio ?? "",
          dateOfBirth: fresh.dateOfBirth ?? "",
          address: fresh.address ?? "",
          nationalId: fresh.nationalId ?? "",
        })
      })
      .catch(() => {
        // Guarded route: if this fails the axios interceptor handles re-auth.
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    let active = true
    getNotificationPreferences()
      .then((prefs) => {
        if (active) setPreferences(prefs)
      })
      .catch(() => {
        // Non-critical: toggles just default to unknown/enabled-looking until retried.
      })
    return () => {
      active = false
    }
  }, [])

  /**
   * Toggles a single notification type's enabled state and persists it immediately.
   *
   * @param type the notification type being toggled
   * @param enabled the new desired state
   */
  async function onTogglePreference(type: NotificationType, enabled: boolean) {
    const previous = preferences
    setPreferences((prev) => prev.map((p) => (p.type === type ? { ...p, enabled } : p)))
    setSavingType(type)
    try {
      await updateNotificationPreferences([{ type, enabled }])
    } catch (err) {
      setPreferences(previous)
      toast.error(getErrorMessage(err))
    } finally {
      setSavingType(null)
    }
  }

  /**
   * Uploads the chosen image and stores its URL for the next profile save.
   *
   * @param event the file input change event
   */
  async function onPickAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const { url } = await uploadImage(file)
      setAvatarUrl(url)
      toast.success(t("profile.photoUploaded"))
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  /**
   * Saves the profile fields and syncs the auth store.
   *
   * @param values the validated profile form values
   */
  async function onSaveProfile(values: ProfileValues) {
    try {
      const updated = await updateMyProfile({
        fullName: values.fullName,
        phone: values.phone?.trim() ? values.phone.trim() : null,
        bio: values.bio?.trim() ? values.bio.trim() : null,
        avatarUrl,
        dateOfBirth: values.dateOfBirth?.trim() ? values.dateOfBirth.trim() : null,
        address: values.address?.trim() ? values.address.trim() : null,
        nationalId: values.nationalId?.trim() ? values.nationalId.trim() : null,
      })
      setMember(updated)
      toast.success(t("profile.profileUpdated"))
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  /**
   * Changes the password and clears the form.
   *
   * @param values the validated password form values
   */
  async function onChangePassword(values: PasswordValues) {
    try {
      await changeMyPassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      toast.success(t("profile.passwordChanged"))
      passwordForm.reset()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <PublicLayout title={t("nav.profile")} description={t("profile.subtitle")}>
      <div className="space-y-6 px-4 lg:px-6">
        {/* Profile */}
        <Form {...profileForm}>
          <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("profile.personalInfo")}</CardTitle>
                <CardDescription>{t("profile.personalInfoDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="h-20 w-20 rounded-lg object-cover" />
                  ) : (
                    <div className="bg-muted flex h-20 w-20 items-center justify-center rounded-lg">
                      <Logo size={48} />
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      className="cursor-pointer"
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {uploading ? t("profile.uploading") : t("profile.uploadPhoto")}
                    </Button>
                    <p className="text-muted-foreground text-xs">{t("profile.photoHint")}</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={onPickAvatar}
                    className="hidden"
                  />
                </div>

                <FormField
                  control={profileForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("profile.fullName")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("profile.fullNamePlaceholder")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>{t("profile.email")}</Label>
                    <Input value={member?.email ?? ""} disabled readOnly />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("profile.role")}</Label>
                    <div>
                      <Badge variant="secondary">{member ? t(`role.${member.role}`) : ""}</Badge>
                    </div>
                  </div>
                </div>

                <FormField
                  control={profileForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("profile.phone")}</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="09xxxxxxxx" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={profileForm.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("profile.bio")}</FormLabel>
                      <FormControl>
                        <Textarea rows={3} placeholder={t("profile.bioPlaceholder")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={profileForm.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("profile.dateOfBirth")}</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="nationalId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("profile.nationalId")}</FormLabel>
                        <FormControl>
                          <Input maxLength={12} placeholder="0123456789xx" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={profileForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("profile.address")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("profile.addressPlaceholder")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            <Button type="submit" className="cursor-pointer" disabled={profileForm.formState.isSubmitting}>
              {profileForm.formState.isSubmitting ? t("profile.saving") : t("profile.saveProfile")}
            </Button>
          </form>
        </Form>

        {/* Change password */}
        <Form {...passwordForm}>
          <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("profile.changePassword")}</CardTitle>
                <CardDescription>{t("profile.changePasswordDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("profile.currentPassword")}</FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="current-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("profile.newPassword")}</FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="new-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("profile.confirmNewPassword")}</FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="new-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            <Button type="submit" className="cursor-pointer" disabled={passwordForm.formState.isSubmitting}>
              {passwordForm.formState.isSubmitting ? t("profile.changing") : t("profile.changePasswordBtn")}
            </Button>
          </form>
        </Form>

        {/* Notification preferences */}
        <Card>
          <CardHeader>
            <CardTitle>{t("notifications.preferencesTitle")}</CardTitle>
            <CardDescription>{t("notifications.preferencesDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {NOTIFICATION_TYPES.map((type) => {
              const pref = preferences.find((p) => p.type === type)
              const enabled = pref?.enabled ?? true
              return (
                <div key={type} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{t(`notifications.preferenceLabels.${type}`)}</span>
                  </div>
                  <Switch
                    checked={enabled}
                    disabled={savingType === type}
                    onCheckedChange={(checked) => onTogglePreference(type, checked)}
                  />
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  )
}
