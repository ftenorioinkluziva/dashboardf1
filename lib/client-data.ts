import type { Session, Driver, Lap, Stint, Position, DriverStanding } from "./types"

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

export async function fetchSessionsByType(meetingKey: string, sessionType: string): Promise<Session[]> {
  try {
    const response = await fetch(`/api/sessions?meetingKey=${meetingKey}&sessionType=${sessionType}`)

    if (!response.ok) {
      throw new Error(`Falha ao buscar sessões do tipo ${sessionType}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error(`Erro ao buscar sessões do tipo ${sessionType}:`, error)
    throw error
  }
}

export async function fetchDrivers(sessionKey: string): Promise<Driver[]> {
  try {
    const response = await fetch(`/api/drivers?sessionKey=${sessionKey}`)

    if (!response.ok) {
      throw new Error("Falha ao buscar pilotos")
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Erro ao buscar pilotos:", error)
    throw error
  }
}

export async function fetchDriverData(
  sessionKey: string,
  driverNumber: string,
): Promise<{
  driver: Driver | null
  laps: Lap[]
  stints: Stint[]
  position: Position | null
  bestLapInfo: {
    bestLapTime: number | null
    bestLapNumber: number | null
  }
}> {
  try {
    const response = await fetch(`/api/drivers/${driverNumber}?sessionKey=${sessionKey}`)

    if (!response.ok) {
      throw new Error("Falha ao buscar dados do piloto")
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Erro ao buscar dados do piloto:", error)
    return {
      driver: null,
      laps: [],
      stints: [],
      position: null,
      bestLapInfo: { bestLapTime: null, bestLapNumber: null },
    }
  }
}

export async function fetchSessionStandings(sessionId: string): Promise<DriverStanding[]> {
  try {
    const response = await fetch(`/api/sessions/${sessionId}/standings`)

    if (!response.ok) {
      throw new Error("Falha ao buscar classificação da sessão")
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Erro ao buscar classificação da sessão:", error)
    return []
  }
}

// Mapeamento de valores de segmentos para cores (cores mais vibrantes)
export const segmentColorMap: Record<number, { color: string; cssColor: string }> = {
  0: { color: "not available", cssColor: "#AAAAAA" },
  2048: { color: "yellow sector", cssColor: "#FFD700" },
  2049: { color: "green sector", cssColor: "#32CD32" },
  2050: { color: "unknown", cssColor: "#DDDDDD" },
  2051: { color: "purple sector", cssColor: "#9932CC" },
  2052: { color: "unknown", cssColor: "#DDDDDD" },
  2064: { color: "pitlane", cssColor: "#FF6347" },
  2068: { color: "unknown", cssColor: "#DDDDDD" },
}
