import { NextResponse } from "next/server"
import { getSessionsByMeetingKey } from "@/lib/data"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const meetingKey = searchParams.get("meetingKey")

  if (!meetingKey) {
    return NextResponse.json({ error: "Meeting key is required" }, { status: 400 })
  }

  try {
    const sessions = await getSessionsByMeetingKey(meetingKey)
    return NextResponse.json(sessions)
  } catch (error) {
    console.error("Error fetching sessions:", error)
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 })
  }
}
