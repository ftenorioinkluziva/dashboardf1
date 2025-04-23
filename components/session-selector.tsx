"use client"

import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Session } from "@/lib/types"

interface SessionSelectorProps {
  sessions: Session[]
  currentSessionId: string
  meetingKey: string
  sessionType: string
}

export function SessionSelector({ sessions, currentSessionId, meetingKey, sessionType }: SessionSelectorProps) {
  const router = useRouter()

  const handleSessionChange = (sessionId: string) => {
    router.push(`/session/${sessionId}?meeting=${meetingKey}`)
  }

  // Filtrar apenas as sessões do tipo especificado
  const filteredSessions = sessions.filter((session) => session.session_type === sessionType)

  if (filteredSessions.length <= 1) {
    return null // Não mostrar o seletor se houver apenas uma sessão do tipo
  }

  return (
    <div className="space-y-2 max-w-md">
      <div className="flex items-center">
        <label htmlFor="session-select" className="text-sm font-medium mr-2">
          Selecionar {sessionType}
        </label>
      </div>
      <Select value={currentSessionId} onValueChange={handleSessionChange}>
        <SelectTrigger id="session-select" className="w-full">
          <SelectValue placeholder={`Selecione o ${sessionType}`} />
        </SelectTrigger>
        <SelectContent>
          {filteredSessions.map((session) => (
            <SelectItem key={session.session_key} value={session.session_key.toString()}>
              {session.session_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
