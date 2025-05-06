import { NextResponse } from "next/server"
import {
  getDriverById,
  getLapsBySessionAndDriver,
  getStintsBySessionAndDriver,
  getDriverPosition,
  getBestLapInfo,
} from "@/lib/data"

export async function GET(request: Request, { params }: { params: Promise<{ driverNumber: string }> }) {
  const { searchParams } = new URL(request.url)
  const sessionKey = searchParams.get("sessionKey")

  // Await the params object before accessing its properties
  const resolvedParams = await params
  const driverNumber = resolvedParams.driverNumber

  if (!sessionKey) {
    return NextResponse.json({ error: "Session key is required" }, { status: 400 })
  }

  try {
    const driver = await getDriverById(sessionKey, driverNumber)

    if (!driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 })
    }

    // Buscar dados de voltas e stints do piloto
    const laps = await getLapsBySessionAndDriver(sessionKey, driverNumber)
    const stints = await getStintsBySessionAndDriver(sessionKey, driverNumber)

    // Buscar posição do piloto
    const position = await getDriverPosition(sessionKey, driverNumber)

    // Buscar informações da melhor volta
    const bestLapInfo = await getBestLapInfo(sessionKey, driverNumber)

    return NextResponse.json({
      driver,
      laps,
      stints,
      position,
      bestLapInfo,
    })
  } catch (error) {
    console.error("Error fetching driver data:", error)
    return NextResponse.json({ error: "Failed to fetch driver data" }, { status: 500 })
  }
}
