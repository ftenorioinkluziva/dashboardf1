"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { AlertCircle } from "lucide-react"

interface RaceControlEvent {
  meeting_key: number
  session_key: number
  date: { $date: string }
  driver_number: number | null
  lap_number: number | null
  category: string
  flag: string
  scope: string
  sector: number | null
  message: string
  _key: string
}

export default function QualifyingDebugPage() {
  const [sessionId, setSessionId] = useState<string>("10024")
  const [raceControlEvents, setRaceControlEvents] = useState<RaceControlEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<string | null>(null)
  const [stages, setStages] = useState<{ name: string; startTime: Date; endTime: Date }[]>([])

  const fetchRaceControlEvents = async () => {
    setLoading(true)
    setError(null)
    try {
      console.log(`Fetching race control events for session: ${sessionId}`)
      const response = await fetch(`/api/sessions/${sessionId}/race-control`)

      if (!response.ok) {
        const errorText = await response.text().catch(() => "No error details available")
        console.error(`API error response (${response.status}):`, errorText)
        throw new Error(`Error ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      console.log(`Received ${data.length} race control events`)
      setRaceControlEvents(data)

      // Processar os estágios
      processStages(data)
    } catch (error) {
      console.error("Error fetching race control events:", error)
      setError(error instanceof Error ? error.message : String(error))
      setRaceControlEvents([])
      setStages([])
    } finally {
      setLoading(false)
    }
  }

  const testRaceControlAccess = async () => {
    setLoading(true)
    setTestResult(null)
    setError(null)
    try {
      const response = await fetch("/api/test-race-control")
      const data = await response.json()

      if (response.ok) {
        setTestResult(JSON.stringify(data, null, 2))
      } else {
        throw new Error(`Error ${response.status}: ${data.message || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Error testing race_control access:", error)
      setError(error instanceof Error ? error.message : String(error))
    } finally {
      setLoading(false)
    }
  }

  const processStages = (events: RaceControlEvent[]) => {
    try {
      // Filtrar eventos relevantes para determinar os estágios
      const greenLightEvents = events.filter(
        (event) => event.message === "GREEN LIGHT - PIT EXIT OPEN" && event.flag === "GREEN",
      )
      const chequeredFlagEvents = events.filter(
        (event) => event.message === "CHEQUERED FLAG" && event.flag === "CHEQUERED",
      )

      console.log(
        `Found ${greenLightEvents.length} green light events and ${chequeredFlagEvents.length} chequered flag events`,
      )

      // Determinar os períodos de cada estágio
      const stagePeriods = []
      const stagePrefix = "Q" // Assumir qualifying regular

      // Para cada evento de luz verde (exceto o último), encontrar a bandeira quadriculada correspondente
      for (let i = 0; i < Math.min(greenLightEvents.length, 3); i++) {
        const startEvent = greenLightEvents[i]
        let endEvent

        // Se não for o último evento de luz verde, o fim é o próximo evento de luz verde
        // Caso contrário, procurar a última bandeira quadriculada
        if (i < greenLightEvents.length - 1) {
          endEvent = greenLightEvents[i + 1]
        } else if (chequeredFlagEvents.length > 0) {
          // Pegar a última bandeira quadriculada
          endEvent = chequeredFlagEvents[chequeredFlagEvents.length - 1]
        } else {
          // Se não houver bandeira quadriculada, usar a data atual
          endEvent = {
            date: { $date: new Date().toISOString() },
          }
        }

        // Garantir que as datas sejam strings ISO válidas antes de criar objetos Date
        let startTimeStr = startEvent.date.$date
        let endTimeStr = endEvent.date.$date

        // Verificar se as strings de data são válidas
        if (typeof startTimeStr !== "string" || !startTimeStr.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
          console.warn(`Invalid start date format: ${startTimeStr}`, startEvent)
          startTimeStr = new Date().toISOString() // Usar data atual como fallback
        }

        if (typeof endTimeStr !== "string" || !endTimeStr.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
          console.warn(`Invalid end date format: ${endTimeStr}`, endEvent)
          endTimeStr = new Date().toISOString() // Usar data atual como fallback
        }

        stagePeriods.push({
          name: `${stagePrefix}${i + 1}`,
          startTime: new Date(startTimeStr),
          endTime: new Date(endTimeStr),
        })
      }

      console.log(`Created ${stagePeriods.length} stage periods`)
      setStages(stagePeriods)
    } catch (err) {
      console.error("Error processing stages:", err)
      setError(`Erro ao processar estágios: ${err instanceof Error ? err.message : String(err)}`)
      setStages([])
    }
  }

  // Função para formatar datas de forma segura
  const formatDate = (date: Date): string => {
    try {
      return date.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    } catch (error) {
      console.error("Error formatting date:", error, date)
      return "Data inválida"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Diagnóstico de Qualifying</h1>

        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Diagnóstico da API</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={testRaceControlAccess} disabled={loading} className="w-full">
                {loading ? "Testando..." : "Testar Acesso à Coleção race_control"}
              </Button>

              {testResult && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
                  <h3 className="font-medium mb-2">Resultado do Teste:</h3>
                  <pre className="text-xs overflow-auto max-h-60 p-2 bg-gray-100 rounded">{testResult}</pre>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Buscar Eventos de Race Control</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">ID da Sessão</label>
                <input
                  type="text"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>

              <Button onClick={fetchRaceControlEvents} disabled={loading} className="w-full">
                {loading ? "Carregando..." : "Buscar Eventos"}
              </Button>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600 flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Erro ao buscar eventos:</p>
                    <p className="text-sm mt-1">{error}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {stages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Estágios Detectados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stages.map((stage, index) => (
                    <div key={index} className="p-4 border rounded-md">
                      <h3 className="font-medium text-lg mb-2">{stage.name}</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Início</p>
                          <p className="font-mono">{formatDate(stage.startTime)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Fim</p>
                          <p className="font-mono">{formatDate(stage.endTime)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Eventos de Race Control</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse h-40 bg-gray-200 rounded"></div>
              ) : raceControlEvents.length > 0 ? (
                <div className="overflow-auto max-h-[500px]">
                  <table className="min-w-full">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left">Data/Hora</th>
                        <th className="px-4 py-2 text-left">Bandeira</th>
                        <th className="px-4 py-2 text-left">Mensagem</th>
                        <th className="px-4 py-2 text-left">Piloto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {raceControlEvents.map((event, index) => {
                        // Garantir que a data seja uma string ISO válida
                        const dateStr = event.date.$date
                        let formattedDate = "Data inválida"

                        try {
                          if (typeof dateStr === "string") {
                            formattedDate = new Date(dateStr).toLocaleString("pt-BR")
                          }
                        } catch (error) {
                          console.error("Error formatting event date:", error, dateStr)
                        }

                        return (
                          <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="px-4 py-2 font-mono text-sm">{formattedDate}</td>
                            <td className="px-4 py-2">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  event.flag === "GREEN"
                                    ? "bg-green-100 text-green-800"
                                    : event.flag === "CHEQUERED"
                                      ? "bg-gray-100 text-gray-800"
                                      : event.flag === "YELLOW"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : event.flag === "RED"
                                          ? "bg-red-100 text-red-800"
                                          : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {event.flag}
                              </span>
                            </td>
                            <td className="px-4 py-2">{event.message}</td>
                            <td className="px-4 py-2">{event.driver_number || "-"}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {error
                    ? "Ocorreu um erro ao buscar os eventos."
                    : 'Nenhum evento encontrado. Clique em "Buscar Eventos" para carregar os dados.'}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
