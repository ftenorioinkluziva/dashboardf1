import type { Session } from "./types"

export async function fetchSessions(meetingKey: string): Promise<Session[]> {
  try {
    const response = await fetch(`/api/sessions?meetingKey=${meetingKey}`)

    if (!response.ok) {
      throw new Error("Falha ao buscar sessões")
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Erro ao buscar sessões:", error)
    throw error
  }
}
