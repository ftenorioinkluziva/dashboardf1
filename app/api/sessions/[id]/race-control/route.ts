import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // Await the params object before accessing its properties
  const resolvedParams = await params
  const sessionId = resolvedParams.id

  // Remover este log

  if (!sessionId) {
    // Remover este log
    return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
  }

  try {
    // Acessar diretamente a coleção race_control
    const { db } = await connectToDatabase()
    const events = await db
      .collection("race_control")
      .find({ session_key: Number.parseInt(sessionId) })
      .sort({ date: 1 })
      .toArray()

    // Remover este log

    // Garantir que as datas estão no formato correto
    const processedEvents = events.map((event) => {
      // Verificar se a data é um objeto Date do MongoDB
      if (event.date && event.date instanceof Date) {
        return {
          ...event,
          date: { $date: event.date.toISOString() },
        }
      }
      // Verificar se a data é um objeto com $date
      else if (event.date && event.date.$date) {
        // Garantir que $date é uma string ISO
        if (typeof event.date.$date === "string") {
          return event
        } else if (event.date.$date instanceof Date) {
          return {
            ...event,
            date: { $date: event.date.$date.toISOString() },
          }
        }
      }

      // Se não conseguir processar, retornar o evento original
      return event
    })

    return NextResponse.json(JSON.parse(JSON.stringify(processedEvents)))
  } catch (error) {
    // Capturar erro silenciosamente
    // Return more detailed error information
    return NextResponse.json(
      {
        error: "Failed to fetch race control events",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
