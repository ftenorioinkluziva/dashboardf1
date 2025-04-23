import { Header } from "@/components/header"
import { getSessionById, getDriverById } from "@/lib/data"
import { formatDate } from "@/lib/utils"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Calendar, Clock, Flag, MapPin } from "lucide-react"
import { DriverData } from "@/components/driver-data"

interface DriverPageProps {
  params: Promise<{
    id: string
    driverNumber: string
  }>
}

export default async function DriverPage({ params }: DriverPageProps) {
  // Aguardar a resolução dos parâmetros
  const resolvedParams = await params
  const id = resolvedParams.id
  const driverNumber = resolvedParams.driverNumber

  const session = await getSessionById(id)
  const driver = await getDriverById(id, driverNumber)

  if (!session || !driver) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href={`/session/${id}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para a sessão
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

        <DriverData sessionId={id} driverNumber={driverNumber} />
      </main>
    </div>
  )
}
