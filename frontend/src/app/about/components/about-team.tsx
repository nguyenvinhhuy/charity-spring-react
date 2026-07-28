"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Users } from "lucide-react"
import { listTeam } from "@/api/members"
import type { TeamMember } from "@/types/member"
import { colorOf, initialsOf } from "@/lib/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DotPattern } from "@/components/dot-pattern"

/** Renders one team member as a centered card: avatar, name, leadership title badge, and a short bio. */
function TeamMemberCard({ member }: { member: TeamMember }) {
  return (
    <Card className="h-full">
      <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
        <div className="relative flex size-28 items-center justify-center">
          <DotPattern size="sm" opacity="medium" fadeStyle="circle" />
          <Avatar className="border-background relative size-20 border-2 shadow-sm">
            {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt="" />}
            <AvatarFallback className={`text-lg font-semibold ${colorOf(member.fullName)}`}>
              {initialsOf(member.fullName)}
            </AvatarFallback>
          </Avatar>
        </div>
        <div>
          <h3 className="font-semibold">{member.fullName}</h3>
          <Badge variant="secondary" className="mt-1">
            {member.leadershipTitle}
          </Badge>
        </div>
        {member.bio && <p className="text-muted-foreground line-clamp-3 text-sm">{member.bio}</p>}
      </CardContent>
    </Card>
  )
}

/** Renders the About page's team section, fetching featured members from the public team endpoint. */
export function AboutTeam() {
  const { t } = useTranslation()
  const [members, setMembers] = useState<TeamMember[]>([])

  useEffect(() => {
    let active = true
    listTeam()
      .then((result) => {
        if (active) setMembers(result)
      })
      .catch(() => {
        // Non-critical decorative section: fail silently.
      })
    return () => {
      active = false
    }
  }, [])

  if (members.length === 0) return null

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 lg:px-6">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <Badge variant="outline" className="mb-3 flex w-fit items-center gap-2 mx-auto">
          <Users className="size-3" />
          {t("aboutPublic.teamBadge")}
        </Badge>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("aboutPublic.teamTitle")}</h2>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => (
          <TeamMemberCard key={member.id} member={member} />
        ))}
      </div>
    </section>
  )
}
