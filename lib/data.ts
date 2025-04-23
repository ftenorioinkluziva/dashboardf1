"use server"

import type { Meeting, Session, Driver, Lap, Stint, Position, DriverStanding } from "./types"
import { connectToDatabase } from "./mongodb"

export async function getMeetings(): Promise<Meeting[]> {
  try {
    const { db } = await connectToDatabase()
    const meetings = await db.collection("meetings").find({}).sort({ date_start: -1 }).toArray()

    return JSON.parse(JSON.stringify(meetings))
  } catch (error) {
    console.error("Erro ao buscar eventos:", error)
    return []
  }
}

export async function getSessionsByMeetingKey(meetingKey: string): Promise<Session[]> {
  try {
    const { db } = await connectToDatabase()
    const sessions = await db
      .collection("sessions")
      .find({ meeting_key: Number.parseInt(meetingKey) })
      .sort({ date_start: 1 })
      .toArray()

    return JSON.parse(JSON.stringify(sessions))
  } catch (error) {
    console.error("Erro ao buscar sessões:", error)
    return []
  }
}

export async function getSessionById(sessionKey: string): Promise<Session | null> {
  try {
    const { db } = await connectToDatabase()
    const session = await db.collection("sessions").findOne({ session_key: Number.parseInt(sessionKey) })

    if (!session) return null

    return JSON.parse(JSON.stringify(session))
  } catch (error) {
    console.error("Erro ao buscar sessão:", error)
    return null
  }
}

export async function getSessionsByTypeAndMeeting(sessionType: string, meetingKey: string): Promise<Session[]> {
  try {
    const { db } = await connectToDatabase()
    const sessions = await db
      .collection("sessions")
      .find({
        session_type: sessionType,
        meeting_key: Number.parseInt(meetingKey),
      })
      .sort({ date_start: 1 })
      .toArray()

    return JSON.parse(JSON.stringify(sessions))
  } catch (error) {
    console.error(`Erro ao buscar sessões do tipo ${sessionType}:`, error)
    return []
  }
}

export async function getDriversBySessionKey(sessionKey: string): Promise<Driver[]> {
  try {
    const { db } = await connectToDatabase()
    const drivers = await db
      .collection("drivers")
      .find({ session_key: Number.parseInt(sessionKey) })
      .sort({ team_name: 1, driver_number: 1 })
      .toArray()

    return JSON.parse(JSON.stringify(drivers))
  } catch (error) {
    console.error("Erro ao buscar pilotos:", error)
    return []
  }
}

export async function getDriverById(sessionKey: string, driverNumber: string): Promise<Driver | null> {
  try {
    const { db } = await connectToDatabase()
    const driver = await db.collection("drivers").findOne({
      session_key: Number.parseInt(sessionKey),
      driver_number: Number.parseInt(driverNumber),
    })

    if (!driver) return null

    return JSON.parse(JSON.stringify(driver))
  } catch (error) {
    console.error("Erro ao buscar piloto:", error)
    return null
  }
}

export async function getLapsBySessionAndDriver(sessionKey: string, driverNumber: string): Promise<Lap[]> {
  try {
    const { db } = await connectToDatabase()

    // Buscar voltas
    const laps = await db
      .collection("laps")
      .find({
        session_key: Number.parseInt(sessionKey),
        driver_number: Number.parseInt(driverNumber),
      })
      .sort({ lap_number: 1 })
      .toArray()

    if (!laps || laps.length === 0) {
      return []
    }

    // Buscar stints para obter informações dos pneus
    const stints = await db
      .collection("stints")
      .find({
        session_key: Number.parseInt(sessionKey),
        driver_number: Number.parseInt(driverNumber),
      })
      .sort({ stint_number: 1 })
      .toArray()

    // Adicionar informações de pneus às voltas
    const lapsWithTyreInfo = laps.map((lap) => {
      const stint = stints.find((s) => lap.lap_number >= s.lap_start && lap.lap_number <= s.lap_end)

      if (stint) {
        return {
          ...lap,
          compound: stint.compound,
          tyre_age: lap.lap_number - stint.lap_start + stint.tyre_age_at_start,
        }
      }

      return lap
    })

    return JSON.parse(JSON.stringify(lapsWithTyreInfo))
  } catch (error) {
    console.error("Erro ao buscar voltas:", error)
    return []
  }
}

export async function getStintsBySessionAndDriver(sessionKey: string, driverNumber: string): Promise<Stint[]> {
  try {
    const { db } = await connectToDatabase()
    const stints = await db
      .collection("stints")
      .find({
        session_key: Number.parseInt(sessionKey),
        driver_number: Number.parseInt(driverNumber),
      })
      .sort({ stint_number: 1 })
      .toArray()

    return JSON.parse(JSON.stringify(stints))
  } catch (error) {
    console.error("Erro ao buscar stints:", error)
    return []
  }
}

export async function getDriverPosition(sessionKey: string, driverNumber: string): Promise<Position | null> {
  try {
    const { db } = await connectToDatabase()
    const position = await db.collection("positions").findOne({
      session_key: Number.parseInt(sessionKey),
      driver_number: Number.parseInt(driverNumber),
    })

    if (!position) return null

    return JSON.parse(JSON.stringify(position))
  } catch (error) {
    console.error("Erro ao buscar posição do piloto:", error)
    return null
  }
}

export async function getBestLapInfo(
  sessionKey: string,
  driverNumber: string,
): Promise<{
  bestLapTime: number | null
  bestLapNumber: number | null
}> {
  try {
    const { db } = await connectToDatabase()
    const laps = await db
      .collection("laps")
      .find({
        session_key: Number.parseInt(sessionKey),
        driver_number: Number.parseInt(driverNumber),
        lap_duration: { $ne: null },
      })
      .sort({ lap_duration: 1 })
      .limit(1)
      .toArray()

    if (!laps || laps.length === 0) {
      return { bestLapTime: null, bestLapNumber: null }
    }

    const bestLap = laps[0]
    return {
      bestLapTime: bestLap.lap_duration,
      bestLapNumber: bestLap.lap_number,
    }
  } catch (error) {
    console.error("Erro ao buscar melhor volta:", error)
    return { bestLapTime: null, bestLapNumber: null }
  }
}

export async function getSessionStandings(sessionKey: string): Promise<DriverStanding[]> {
  try {
    const { db } = await connectToDatabase()

    // Buscar todos os pilotos da sessão
    const drivers = await db
      .collection("drivers")
      .find({ session_key: Number.parseInt(sessionKey) })
      .toArray()

    if (!drivers || drivers.length === 0) {
      return []
    }

    // Para cada piloto, buscar sua melhor volta e posição
    const standings: DriverStanding[] = []

    for (const driver of drivers) {
      // Buscar a melhor volta
      const bestLapInfo = await getBestLapInfo(sessionKey, driver.driver_number.toString())

      // Buscar a posição
      const position = await getDriverPosition(sessionKey, driver.driver_number.toString())

      if (bestLapInfo.bestLapTime !== null) {
        standings.push({
          driverNumber: driver.driver_number,
          fullName: driver.full_name,
          nameAcronym: driver.name_acronym,
          teamName: driver.team_name,
          teamColor: driver.team_colour,
          headshotUrl: driver.headshot_url,
          bestLapTime: bestLapInfo.bestLapTime,
          bestLapNumber: bestLapInfo.bestLapNumber || 0,
          position: position?.position || 999, // Usar um valor alto se não tiver posição
        })
      }
    }

    // Ordenar por tempo de volta (do mais rápido para o mais lento)
    standings.sort((a, b) => a.bestLapTime - b.bestLapTime)

    return standings
  } catch (error) {
    console.error("Erro ao buscar classificação da sessão:", error)
    return []
  }
}
