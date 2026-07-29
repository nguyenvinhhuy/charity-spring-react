// ---- Campaign registrations ----

export interface RegistrationSummary {
  registeredCount: number
  isRegistered: boolean
  myRegisteredAt: string | null
  canCancel: boolean
}

export interface Registrant {
  memberId: number
  memberName: string
  registeredAt: string
}
