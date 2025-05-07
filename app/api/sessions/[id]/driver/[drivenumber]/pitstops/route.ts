import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import type { PitStop } from "@/lib/types"

export async function GET(request: NextRequest, context: { params: { id: string; driverNumber: string } }) {
  try {
    const { id, driverNumber } = context.params

    console.log(`Buscando pit stops para sessão ${id} e piloto ${driverNumber}`)

    const { db } = await connectToDatabase()

    // Buscar informações da sessão para obter as chaves
    const session = await db.collection("sessions").findOne({ session_key: Number.parseInt(id) })

    if (!session) {
      console.error(`Sessão ${id} não encontrada`)
      return NextResponse.json([], { status: 404 })
    }

    // Buscar os pit stops do piloto
    const pitStops = await db
      .collection("pit_stops")
      .find({
        session_key: Number.parseInt(id),
        driver_number: Number.parseInt(driverNumber),
      })
      .sort({ lap_number: 1 })
      .toArray()

    // Se não encontrarmos pit stops na coleção principal, tentar buscar em outras coleções
    if (!pitStops || pitStops.length === 0) {
      // Tentar buscar informações de pit stops a partir dos stints
      const stints = await db
        .collection("stints")
        .find({
          session_key: Number.parseInt(id),
          driver_number: Number.parseInt(driverNumber),
        })
        .sort({ stint_number: 1 })
        .toArray()

      // Se tivermos mais de um stint, podemos inferir pit stops entre eles
      if (stints && stints.length > 1) {
        const inferredPitStops: PitStop[] = []

        for (let i = 0; i < stints.length - 1; i++) {
          const currentStint = stints[i]
          const nextStint = stints[i + 1]

          // Inferir um pit stop entre os stints
          inferredPitStops.push({
            _id: { $numberLong: `${i}` },
            meeting_key: session.meeting_key,
            session_key: Number.parseInt(id),
            driver_number: Number.parseInt(driverNumber),
            lap_number: currentStint.lap_end,
            pit_duration: 25, // Valor padrão estimado em segundos
            total_duration: 25,
            date: currentStint._date_start_last_lap,
            previous_compound: currentStint.compound,
            new_compound: nextStint.compound,
            _key: `inferred_${i}`,
            inferred: true,
          })
        }

        console.log(`Inferidos ${inferredPitStops.length} pit stops para o piloto ${driverNumber}`)
        return NextResponse.json(inferredPitStops)
      }
    }

    console.log(`Encontrados ${pitStops?.length || 0} pit stops para o piloto ${driverNumber}`)
    return NextResponse.json(pitStops || [])
  } catch (error) {
    console.error("Erro ao buscar pit stops:", error)
    return NextResponse.json([], { status: 500 })
  }
}
