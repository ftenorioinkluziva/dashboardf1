import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: Request, { params }: { params: Promise<{ id: string; driverNumber: string }> }) {
  try {
    const { db } = await connectToDatabase()
    const resolvedParams = await params
    const sessionId = resolvedParams.id
    const driverNumber = Number.parseInt(resolvedParams.driverNumber)

    // Buscar informações da sessão para obter as chaves
    const session = await db.collection("sessions").findOne({ _key: sessionId })

    if (!session) {
      return NextResponse.json({ error: "Sessão não encontrada" }, { status: 404 })
    }

    // Buscar os stints do piloto
    const stints = await db
      .collection("stints")
      .find({
        meeting_key: session.meeting_key,
        session_key: session.session_key,
        driver_number: driverNumber,
      })
      .sort({ stint_number: 1 })
      .toArray()

    // Se não houver stints, retornar array vazio
    if (!stints || stints.length === 0) {
      return NextResponse.json([])
    }

    // Buscar as voltas para cada stint para calcular a melhor volta
    const laps = await db
      .collection("laps")
      .find({
        meeting_key: session.meeting_key,
        session_key: session.session_key,
        driver_number: driverNumber,
      })
      .toArray()

    // Enriquecer os stints com informações da melhor volta
    const enrichedStints = stints.map((stint) => {
      // Filtrar voltas deste stint
      const stintLaps = laps.filter((lap) => lap.lap_number >= stint.lap_start && lap.lap_number <= stint.lap_end)

      // Encontrar a melhor volta do stint
      let bestLap = null
      let bestLapTime = Number.POSITIVE_INFINITY

      for (const lap of stintLaps) {
        if (lap.lap_duration && lap.lap_duration < bestLapTime) {
          bestLapTime = lap.lap_duration
          bestLap = lap
        }
      }

      return {
        ...stint,
        best_lap_time: bestLap?.lap_duration || null,
        best_lap_number: bestLap?.lap_number || null,
        sector1_time: bestLap?.duration_sector_1 || null,
        sector2_time: bestLap?.duration_sector_2 || null,
        sector3_time: bestLap?.duration_sector_3 || null,
      }
    })

    return NextResponse.json(enrichedStints)
  } catch (error) {
    console.error("Erro ao buscar stints:", error)
    return NextResponse.json({ error: "Erro ao buscar stints" }, { status: 500 })
  }
}
