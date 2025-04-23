"use client"

import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Session } from "@/lib/types"

interface PracticeSelectorProps {
  sessions: Session[]
  currentSessionId: string
  meetingKey: string
}

export function PracticeSelector({ sessions, currentSessionId, meetingKey }: PracticeSelectorProps) {
  const router = useRouter()

  const handleSessionChange = (sessionId: string) => {
    router.push(`/session/${sessionId}?meeting=${meetingKey}`)
  }

  return (
    <div className="space-y-2 max-w-md">
      <div className="flex items-center">
        <label htmlFor="practice-select" className="text-sm font-medium mr-2">
          Selecionar Treino
        </label>
      </div>
      <Select value={currentSessionId} onValueChange={handleSessionChange}>
        <SelectTrigger id="practice-select" className="w-full">
          <SelectValue placeholder="Selecione o treino" />
        </SelectTrigger>
        <SelectContent>
          {sessions.map((session) => (
            <SelectItem key={session.session_key} value={session.session_key.toString()}>
              {session.session_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
