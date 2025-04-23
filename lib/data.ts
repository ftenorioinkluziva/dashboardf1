import type { Meeting, Session } from "./types"
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
