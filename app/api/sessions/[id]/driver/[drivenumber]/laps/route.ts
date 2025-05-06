import { type NextRequest, NextResponse } from "next/server"
import { getLapsBySessionAndDriver } from "@/lib/data"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; driverNumber: string }> }) {
  try {
    const resolvedParams = await params
    const sessionId = resolvedParams.id
    const driverNumber = resolvedParams.driverNumber

    if (!sessionId || !driverNumber) {
      return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 })
    }

    console.log(`Buscando voltas para a sessão ${sessionId} e piloto ${driverNumber}`)

    // Certifique-se de que estamos passando os parâmetros no formato correto
    const laps = await getLapsBySessionAndDriver(sessionId, driverNumber)

    // Adicionar flag para melhor volta pessoal
    if (laps && laps.length > 0) {
      // Encontrar a volta mais rápida
      const fastestLap = laps.reduce((fastest, current) => {
        if (!fastest.lap_duration) return current
        if (!current.lap_duration) return fastest
        return current.lap_duration < fastest.lap_duration ? current : fastest
      }, laps[0])

      // Marcar a volta mais rápida
      laps.forEach((lap) => {
        lap.is_personal_best = lap.lap_number === fastestLap.lap_number
      })
    }

    return NextResponse.json(laps || [])
  } catch (error) {
    console.error("Erro ao buscar voltas do piloto:", error)
    return NextResponse.json({ error: "Erro ao buscar voltas do piloto" }, { status: 500 })
  }
}
