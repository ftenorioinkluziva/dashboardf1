import { NextResponse } from "next/server"
import { getDriversBySessionKey } from "@/lib/data"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sessionKey = searchParams.get("sessionKey")

  if (!sessionKey) {
    return NextResponse.json({ error: "Session key is required" }, { status: 400 })
  }

  try {
    const drivers = await getDriversBySessionKey(sessionKey)
    return NextResponse.json(drivers)
  } catch (error) {
    console.error("Error fetching drivers:", error)
    return NextResponse.json({ error: "Failed to fetch drivers" }, { status: 500 })
  }
}
