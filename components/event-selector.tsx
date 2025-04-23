"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import type { Meeting } from "@/lib/types"

interface EventSelectorProps {
  meetings: Meeting[]
}

export function EventSelector({ meetings }: EventSelectorProps) {
  const [selectedEvent, setSelectedEvent] = useState<string>("")
  const router = useRouter()

  const handleEventChange = (value: string) => {
    setSelectedEvent(value)
    // Atualiza a URL com o evento selecionado para que possamos carregar as sessões
    router.push(`/?meeting=${value}`)
  }

  return (
    <div className="space-y-2 max-w-md mx-auto">
      <div className="flex items-center">
        <label htmlFor="event-select" className="text-sm font-medium mr-2">
          Eventos <span className="text-red-500">*</span>
        </label>
      </div>
      <p className="text-xs text-muted-foreground mb-2">Eventos disponíveis</p>
      <Select value={selectedEvent} onValueChange={handleEventChange}>
        <SelectTrigger id="event-select" className="w-full">
          <SelectValue placeholder="Selecione o evento para visualizar os dados" />
        </SelectTrigger>
        <SelectContent>
          {meetings.map((meeting) => (
            <SelectItem key={meeting._key} value={meeting._key}>
              {meeting.meeting_name} ({meeting.year})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
