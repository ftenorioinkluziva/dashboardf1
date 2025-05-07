"use client"

import type { DriverStanding, RaceResult, Session, QualifyingResult } from "./types"

export async function fetchSessionStandings(sessionId: string): Promise<DriverStanding[] | RaceResult[]> {
  try {
    const response = await fetch(`/api/sessions/${sessionId}/standings`)
    if (!response.ok) {
      throw new Error(`Failed to fetch session standings: ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error("Error fetching session standings:", error)
    return []
  }
}

export async function fetchRaceStandings(sessionId: string): Promise<DriverStanding[] | RaceResult[]> {
  try {
    const response = await fetch(`/api/sessions/${sessionId}/standings`)
    if (!response.ok) {
      throw new Error(`Failed to fetch session standings: ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error("Error fetching session standings:", error)
    return []
  }
}

export async function fetchDrivers(sessionKey: string) {
  try {
    const response = await fetch(`/api/drivers?sessionKey=${sessionKey}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch drivers: ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error("Error fetching drivers:", error)
    return []
  }
}

export async function fetchSessions(meetingKey: string): Promise<Session[]> {
  try {
    const response = await fetch(`/api/sessions?meetingKey=${meetingKey}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch sessions: ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error("Error fetching sessions:", error)
    return []
  }
}

export async function fetchDriverData(sessionId: string, driverNumber: string): Promise<any> {
  try {
    const response = await fetch(`/api/drivers/${driverNumber}?sessionKey=${sessionId}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch driver data: ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error("Error fetching driver data:", error)
    return null
  }
}

export async function fetchQualifyingResults(sessionId: string): Promise<QualifyingResult> {
  try {
    const response = await fetch(`/api/sessions/${sessionId}/qualifying`)
    if (!response.ok) {
      throw new Error(`Failed to fetch qualifying results: ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error("Error fetching qualifying results:", error)
    return { stages: [], finalGrid: [] }
  }
}

export const segmentColorMap: { [key: number]: { value: number; color: string; cssColor: string } } = {
  0: { value: 0, color: "Sem dados", cssColor: "#ccc" },
  1: { value: 1, color: "Verde", cssColor: "#34D399" },
  2: { value: 2, color: "Roxo", cssColor: "#A855F7" },
  3: { value: 3, color: "Amarelo", cssColor: "#F59E0B" },
  4: { value: 4, color: "Vermelho", cssColor: "#EF4444" },
  5: { value: 5, color: "Azul", cssColor: "#3B82F6" },
}
