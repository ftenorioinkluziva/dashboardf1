import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import type { TeamRadio } from "@/lib/types"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; driverNumber: string }> }
) {
  try {
    // Aguardar a resolução dos parâmetros
    const resolvedParams = await params;
    const { id, driverNumber } = resolvedParams;
    
    console.log(`Buscando mensagens de rádio para sessão ${id} e piloto ${driverNumber}`)

    const { db } = await connectToDatabase()

    // Buscar informações da sessão para obter as chaves
    const session = await db.collection("sessions").findOne({ session_key: Number.parseInt(id) })

    if (!session) {
      console.error(`Sessão ${id} não encontrada`)
      return NextResponse.json([], { status: 404 })
    }

    // Buscar as mensagens de rádio do piloto
    const radioMessages = await db
      .collection("team_radio")
      .find({
        session_key: Number.parseInt(id),
        driver_number: Number.parseInt(driverNumber),
      })
      .sort({ date: 1 })
      .toArray()

    // Se não encontrarmos mensagens reais, gerar algumas mensagens simuladas para demonstração
    if (!radioMessages || radioMessages.length === 0) {
      const laps = await db
        .collection("laps")
        .find({
          session_key: Number.parseInt(id),
          driver_number: Number.parseInt(driverNumber),
        })
        .sort({ lap_number: 1 })
        .toArray()

      if (laps && laps.length > 0) {
        // Selecionar algumas voltas para gerar mensagens simuladas
        const selectedLaps = [
          Math.floor(laps.length * 0.2),
          Math.floor(laps.length * 0.5),
          Math.floor(laps.length * 0.8),
        ].map((index) => laps[Math.min(index, laps.length - 1)])

        const simulatedMessages: TeamRadio[] = []

        // Gerar mensagens simuladas para as voltas selecionadas
        selectedLaps.forEach((lap, index) => {
          const messages = [
            {
              direction: "to_driver" as const,
              message: "Como estão os pneus?",
            },
            {
              direction: "from_driver" as const,
              message:
                index === 0
                  ? "Pneus estão bons, carro está equilibrado."
                  : index === 1
                    ? "Começando a perder aderência na traseira."
                    : "Precisamos trocar os pneus logo, estão muito desgastados.",
            },
            {
              direction: "to_driver" as const,
              message: index === 2 ? "Box nesta volta, box box." : "Entendido, continue assim.",
            },
          ]

          messages.forEach((msg, msgIndex) => {
            simulatedMessages.push({
              _id: { $numberLong: `${index}_${msgIndex}` },
              meeting_key: session.meeting_key,
              session_key: Number.parseInt(id),
              driver_number: Number.parseInt(driverNumber),
              lap_number: lap.lap_number,
              date: { $date: new Date(lap.date_start.$date).toISOString() },
              message: msg.message,
              direction: msg.direction,
              _key: `simulated_${index}_${msgIndex}`,
              simulated: true,
            })
          })
        })

        console.log(`Geradas ${simulatedMessages.length} mensagens simuladas para o piloto ${driverNumber}`)
        return NextResponse.json(simulatedMessages)
      }
    }

    console.log(`Encontradas ${radioMessages?.length || 0} mensagens de rádio para o piloto ${driverNumber}`)
    return NextResponse.json(radioMessages || [])
  } catch (error) {
    console.error("Erro ao buscar mensagens de rádio:", error)
    return NextResponse.json([], { status: 500 })
  }
}
