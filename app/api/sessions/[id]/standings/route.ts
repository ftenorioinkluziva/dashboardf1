import { NextResponse } from "next/server"
import { getSessionById, getSessionStandings, getRaceResults } from "@/lib/data"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    // Aguardar a resolução dos parâmetros se for uma Promise
    const resolvedParams = params instanceof Promise ? await params : params
    const sessionId = resolvedParams.id

    if (!sessionId) {
      return NextResponse.json({ error: "ID da sessão não fornecido" }, { status: 400 })
    }

    // Buscar a sessão para determinar o tipo
    const session = await getSessionById(sessionId)

    if (!session) {
      return NextResponse.json({ error: "Sessão não encontrada" }, { status: 404 })
    }

    console.log(`Tipo de sessão: ${session.session_type}, Nome: ${session.session_name}`)

    // Determinar qual função usar com base no tipo de sessão
    let results
    if (session.session_type === "Race" || session.session_name.includes("Sprint")) {
      console.log("Buscando resultados de corrida")
      results = await getRaceResults(sessionId)
    } else {
      console.log("Buscando classificação da sessão")
      results = await getSessionStandings(sessionId)
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error("Erro ao buscar classificação da sessão:", error)
    return NextResponse.json({ error: "Erro ao buscar classificação da sessão" }, { status: 500 })
  }
}
