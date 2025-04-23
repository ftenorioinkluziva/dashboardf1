import { Header } from "@/components/header"
import { getSessionById, getSessionsByMeetingKey } from "@/lib/data"
import { formatDate } from "@/lib/utils"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Calendar, Clock, Flag, MapPin } from "lucide-react"
import { SessionSelector } from "@/components/session-selector"
import { SessionStandings } from "@/components/session-standings"
import Image from "next/image"

interface SessionPageProps {
  params: Promise<{
    id: string
  }>
  searchParams: Promise<{
    meeting?: string
  }>
}

export default async function SessionPage({ params, searchParams }: SessionPageProps) {
  // Aguardar a resolução dos parâmetros
  const id = await (await params).id
  const meetingParam = await (await searchParams).meeting

  const session = await getSessionById(id)

  if (!session) {
    notFound()
  }

  // Buscar todas as sessões do mesmo meeting para o seletor
  const allSessions = meetingParam ? await getSessionsByMeetingKey(meetingParam) : []

  // Mapeamento de nomes de circuitos para arquivos de imagem
  const circuitImageMap: Record<string, string> = {
    Melbourne: "/images/circuits/melbourne.png",
    "Albert Park": "/images/circuits/melbourne.png",
    Shanghai: "/placeholder.svg?height=300&width=500", // Adicionar imagem do circuito de Shanghai quando disponível
    // Adicione mais circuitos conforme necessário
  }

  // Determinar qual imagem usar
  const circuitImageUrl = circuitImageMap[session.circuit_short_name] || "/placeholder.svg?height=300&width=500"

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href={`/?meeting=${session.meeting_key}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para eventos
          </Link>
        </div>

        {/* Seletor de sessão - funciona para qualquer tipo de sessão */}
        {allSessions.length > 0 && (
          <div className="mb-6">
            <SessionSelector
              sessions={allSessions}
              currentSessionId={id}
              meetingKey={session.meeting_key.toString()}
              sessionType={session.session_type}
            />
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{session.session_name}</h1>
          <h2 className="text-xl text-muted-foreground">
            {session.country_name} - {session.location}
          </h2>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Coluna da esquerda - Cards informativos */}
          <div className="lg:w-1/2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Data</span>
              </div>
              <p className="font-medium">{formatDate(session.date_start)}</p>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Horário</span>
              </div>
              <p className="font-medium">
                {new Date(session.date_start).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "UTC",
                })}{" "}
                -{" "}
                {new Date(session.date_end).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "UTC",
                })}
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">Circuito</span>
              </div>
              <p className="font-medium">{session.circuit_short_name}</p>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                <Flag className="h-4 w-4" />
                <span className="text-sm">Tipo</span>
              </div>
              <p className="font-medium">{session.session_type}</p>
            </div>
          </div>

          {/* Coluna da direita - Mapa do circuito */}
          <div className="lg:w-1/2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="font-medium">Circuito: {session.circuit_short_name}</h3>
                <span className="text-sm text-muted-foreground">{session.country_name}</span>
              </div>
              <div className="p-4">
                <div className="relative h-[200px] w-full rounded-md overflow-hidden">
                  <Image
                    src={circuitImageUrl || "/placeholder.svg"}
                    alt={`Circuito de ${session.circuit_short_name}`}
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <SessionStandings sessionId={id} />
        </div>
      </main>
    </div>
  )
}
