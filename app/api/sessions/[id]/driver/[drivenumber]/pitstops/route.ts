import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: Request, { params }: { params: { id: string; driverNumber: string } }) {
  try {
    const { db } = await connectToDatabase()
    const sessionId = params.id
    const driverNumber = Number.parseInt(params.driverNumber)

    // Buscar informações da sessão para obter as chaves
    const session = await db.collection("sessions").findOne({ _key: sessionId })

    if (!session) {
      return NextResponse.json({ error: "Sessão não encontrada" }, { status: 404 })
    }

    // Buscar os pit stops do piloto
    const pitStops = await db
      .collection("pit_stops")
      .find({
        meeting_key: session.meeting_key,
        session_key: session.session_key,
        driver_number: driverNumber,
      })
      .sort({ lap_number: 1 })
      .toArray()

    return NextResponse.json(pitStops || [])
  } catch (error) {
    console.error("Erro ao buscar pit stops:", error)
    return NextResponse.json({ error: "Erro ao buscar pit stops" }, { status: 500 })
  }
}
