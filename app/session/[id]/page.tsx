import { Header } from "@/components/header"
import { getSessionById } from "@/lib/data"
import { formatDate } from "@/lib/utils"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Calendar, Clock, Flag, MapPin } from "lucide-react"

interface SessionPageProps {
  params: {
    id: string
  }
}

export default async function SessionPage({ params }: SessionPageProps) {
  const session = await getSessionById(params.id)

  if (!session) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para eventos
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{session.session_name}</h1>
          <h2 className="text-xl text-muted-foreground">
            {session.country_name} - {session.location}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card rounded-lg p-4 shadow-sm border">
            <div className="flex items-center gap-2 mb-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Data</span>
            </div>
            <p className="font-medium">{formatDate(session.date_start)}</p>
          </div>

          <div className="bg-card rounded-lg p-4 shadow-sm border">
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

          <div className="bg-card rounded-lg p-4 shadow-sm border">
            <div className="flex items-center gap-2 mb-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">Circuito</span>
            </div>
            <p className="font-medium">{session.circuit_short_name}</p>
          </div>

          <div className="bg-card rounded-lg p-4 shadow-sm border">
            <div className="flex items-center gap-2 mb-2 text-muted-foreground">
              <Flag className="h-4 w-4" />
              <span className="text-sm">Tipo</span>
            </div>
            <p className="font-medium">{session.session_type}</p>
          </div>
        </div>

        <div className="bg-card rounded-lg p-6 shadow-sm border mb-8">
          <h3 className="text-xl font-semibold mb-4">Selecione um piloto</h3>
          <p className="text-muted-foreground mb-4">
            Selecione um piloto para visualizar os dados detalhados desta sessão.
          </p>

          {/* Aqui você pode adicionar um seletor de pilotos quando tiver esses dados */}
          <div className="bg-muted p-4 rounded-md text-center">
            <p className="text-muted-foreground">Dados de pilotos serão implementados em breve</p>
          </div>
        </div>

        <div className="bg-card rounded-lg p-6 shadow-sm border">
          <h3 className="text-xl font-semibold mb-4">Dados da Sessão</h3>
          <p className="text-muted-foreground mb-6">
            Aqui serão exibidos os gráficos e dados detalhados da sessão para o piloto selecionado.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-muted p-8 rounded-md text-center h-64 flex items-center justify-center">
              <p className="text-muted-foreground">Gráfico de Tempos por Volta</p>
            </div>
            <div className="bg-muted p-8 rounded-md text-center h-64 flex items-center justify-center">
              <p className="text-muted-foreground">Gráfico de Velocidade</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
