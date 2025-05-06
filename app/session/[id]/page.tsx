import { getSessionById } from "@/lib/data"
import { SessionStandings } from "@/components/session-standings"
import { QualifyingResults } from "@/components/qualifying-results"
import { RaceResults } from "@/components/race-results"
import { formatDate } from "@/lib/utils"

// Modifique a interface SessionPageProps para aceitar params como Promise ou objeto direto
interface SessionPageProps {
  params:
    | Promise<{
        id: string
      }>
    | {
        id: string
      }
}

export default async function SessionPage({ params }: SessionPageProps) {
  // Aguardar a resolução dos parâmetros se for uma Promise
  const resolvedParams = params instanceof Promise ? await params : params
  const sessionId = resolvedParams.id

  const session = await getSessionById(sessionId)

  if (!session) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Sessão não encontrada</h1>
          <p className="text-gray-600">A sessão solicitada não foi encontrada ou não está disponível.</p>
        </div>
      </div>
    )
  }

  // Vamos atualizar a lógica para determinar o componente correto com base no session_type e session_name
  let sessionComponent
  if (session.session_type === "Qualifying") {
    // Qualquer tipo de classificação usa o componente QualifyingResults
    sessionComponent = <QualifyingResults sessionId={sessionId} />
  } else if (session.session_type === "Race") {
    // Tanto a corrida principal quanto a sprint usam o componente RaceResults
    // Passamos o session_name para diferenciar entre eles na UI
    sessionComponent = <RaceResults sessionId={sessionId} sessionType={session.session_name} />
  } else {
    // Para sessões de treino (Practice)
    sessionComponent = <SessionStandings sessionId={sessionId} />
  }

  // Formatar a data corretamente
  const formattedDate = formatDate(session.date_start.$date)

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">{session.session_name}</h1>
        <p className="text-gray-600">
          {session.location} - {formattedDate}
        </p>
      </div>

      {sessionComponent}
    </div>
  )
}
