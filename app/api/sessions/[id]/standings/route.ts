import { NextResponse } from "next/server"
import { getSessionStandings } from "@/lib/data"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // Aguardar a resolução dos parâmetros
  const resolvedParams = await params
  const sessionId = resolvedParams.id

  if (!sessionId) {
    return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
  }

  try {
    const standings = await getSessionStandings(sessionId)
    return NextResponse.json(standings)
  } catch (error) {
    console.error("Error fetching session standings:", error)
    return NextResponse.json({ error: "Failed to fetch session standings" }, { status: 500 })
  }
}
