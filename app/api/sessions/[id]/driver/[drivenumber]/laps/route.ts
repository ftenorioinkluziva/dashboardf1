import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(
  request: NextRequest,
  context: { params: { id: string; driverNumber: string } }
) {
  try {
    // Acessar os parâmetros da rota da forma correta
    const id = context.params.id;
    const driverNumber = context.params.driverNumber;
    
    console.log(`Buscando voltas para sessão ${id} e piloto ${driverNumber}`);

    const { db } = await connectToDatabase();

    const laps = await db
      .collection("laps")
      .find({
        session_key: Number.parseInt(id),
        driver_number: Number.parseInt(driverNumber),
      })
      .sort({ lap_number: 1 })
      .toArray();

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

    console.log(`Encontradas ${laps?.length || 0} voltas para o piloto ${driverNumber}`)
    return NextResponse.json(laps || [])
  } catch (error) {
    console.error("Erro ao buscar voltas:", error)
    return NextResponse.json([], { status: 500 })
  }
}
