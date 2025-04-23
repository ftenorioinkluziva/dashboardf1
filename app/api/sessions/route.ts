import { NextResponse } from "next/server"
import { getSessionsByMeetingKey, getSessionsByTypeAndMeeting } from "@/lib/data"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const meetingKey = searchParams.get("meetingKey")
  const sessionType = searchParams.get("sessionType")

  if (!meetingKey) {
    return NextResponse.json({ error: "Meeting key is required" }, { status: 400 })
  }

  try {
    let sessions

    if (sessionType) {
      // Se o tipo de sessão for fornecido, buscar apenas sessões desse tipo
      sessions = await getSessionsByTypeAndMeeting(sessionType, meetingKey)
    } else {
      // Caso contrário, buscar todas as sessões do meeting
      sessions = await getSessionsByMeetingKey(meetingKey)
    }

    return NextResponse.json(sessions)
  } catch (error) {
    console.error("Error fetching sessions:", error)
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 })
  }
}
