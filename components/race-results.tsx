"use client"

import { useEffect, useState, useRef } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatLapTime } from "@/lib/utils"
import type { RaceResult, Lap, Stint, PitStop, TeamRadio } from "@/lib/types"
import { TyreIndicator } from "./tyre-indicator"
import Image from "next/image"
import { ChevronDown, ChevronRight, Loader2, MessageSquare, Clock, Filter } from "lucide-react"
import React from "react"

interface RaceResultsProps {
  sessionId: string
  sessionType: string // Pode ser "Race" ou "Sprint"
}

export function RaceResults({ sessionId, sessionType }: RaceResultsProps) {
  const [results, setResults] = useState<RaceResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedDriver, setExpandedDriver] = useState<number | null>(null)
  const [driverDetails, setDriverDetails] = useState<{
    bestLap: Lap | null
    allLaps: Lap[]
    stints: Stint[]
    pitStops: PitStop[]
    radioMessages: TeamRadio[]
    isLoading: boolean
  }>({
    bestLap: null,
    allLaps: [],
    stints: [],
    pitStops: [],
    radioMessages: [],
    isLoading: false,
  })
  const [activeTab, setActiveTab] = useState("setores")

  // Cache para evitar requisições repetidas
  const dataCache = useRef<{
    laps: Record<number, Lap[]>
    stints: Record<number, Stint[]>
    pitStops: Record<number, PitStop[]>
    radioMessages: Record<number, TeamRadio[]>
  }>({
    laps: {},
    stints: {},
    pitStops: {},
    radioMessages: {},
  })

  useEffect(() => {
    async function fetchRaceResults() {
      try {
        setLoading(true)
        const response = await fetch(`/api/sessions/${sessionId}/standings`)

        if (!response.ok) {
          throw new Error(`Erro ao buscar resultados: ${response.status}`)
        }

        const data = await response.json()
        setResults(data)
      } catch (err) {
        console.error("Erro ao buscar resultados da corrida:", err)
        setError("Não foi possível carregar os resultados da corrida.")
      } finally {
        setLoading(false)
      }
    }

    fetchRaceResults()
  }, [sessionId])

  const toggleDriverDetails = async (driverNumber: number) => {
    if (expandedDriver === driverNumber) {
      // Se já está expandido, fechamos
      setExpandedDriver(null)
      return
    }

    // Expandir e carregar os detalhes
    setExpandedDriver(driverNumber)
    setDriverDetails((prev) => ({ ...prev, isLoading: true }))

    try {
      // Verificar se já temos os dados em cache
      const cachedLaps = dataCache.current.laps[driverNumber]
      const cachedStints = dataCache.current.stints[driverNumber]
      const cachedPitStops = dataCache.current.pitStops[driverNumber]
      const cachedRadioMessages = dataCache.current.radioMessages[driverNumber]

      // Buscar dados que não estão em cache
      const [lapsData, stintsData, pitStopsData, radioMessagesData] = await Promise.all([
        cachedLaps
          ? Promise.resolve(cachedLaps)
          : fetchDriverData(`/api/sessions/${sessionId}/driver/${driverNumber}/laps`),
        cachedStints
          ? Promise.resolve(cachedStints)
          : fetchDriverData(`/api/sessions/${sessionId}/driver/${driverNumber}/stints`),
        cachedPitStops
          ? Promise.resolve(cachedPitStops)
          : fetchDriverData(`/api/sessions/${sessionId}/driver/${driverNumber}/pitstops`),
        cachedRadioMessages
          ? Promise.resolve(cachedRadioMessages)
          : fetchDriverData(`/api/sessions/${sessionId}/driver/${driverNumber}/radio`),
      ])

      // Armazenar no cache se não estiver lá
      if (!cachedLaps) dataCache.current.laps[driverNumber] = lapsData
      if (!cachedStints) dataCache.current.stints[driverNumber] = stintsData
      if (!cachedPitStops) dataCache.current.pitStops[driverNumber] = pitStopsData
      if (!cachedRadioMessages) dataCache.current.radioMessages[driverNumber] = radioMessagesData

      // Encontrar a melhor volta
      const bestLap =
        lapsData.find(
          (lap: Lap) => lap.lap_number === results.find((r) => r.driverNumber === driverNumber)?.bestLapNumber,
        ) || null

      // Ordenar as voltas por número
      const sortedLaps = [...lapsData].sort((a, b) => a.lap_number - b.lap_number)

      setDriverDetails({
        bestLap,
        allLaps: sortedLaps,
        stints: stintsData || [],
        pitStops: pitStopsData || [],
        radioMessages: radioMessagesData || [],
        isLoading: false,
      })
    } catch (error) {
      console.error("Erro ao carregar detalhes do piloto:", error)
      setDriverDetails({
        bestLap: null,
        allLaps: [],
        stints: [],
        pitStops: [],
        radioMessages: [],
        isLoading: false,
      })
    }
  }

  // Função auxiliar para buscar dados
  const fetchDriverData = async (url: string) => {
    console.log(`Buscando dados de: ${url}`)
    try {
      const response = await fetch(url)
      if (!response.ok) {
        console.error(`Erro ao buscar dados: ${response.status} - ${url}`)
        return []
      }
      const data = await response.json()
      console.log(`Dados recebidos de ${url}: ${data.length} registros`)
      return data
    } catch (error) {
      console.error(`Erro ao buscar dados de ${url}:`, error)
      return []
    }
  }

  // Formatar tempo de pit stop
  const formatPitTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins > 0 ? `${mins}m ` : ""}${secs.toFixed(3)}s`
  }

  // Formatar data para exibição
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            <span className="ml-2 text-gray-500">Carregando resultados...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">{error}</div>
        </CardContent>
      </Card>
    )
  }

  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Nenhum resultado disponível para esta sessão.</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Resultados da {sessionType}</h2>

      <div className="overflow-x-auto border rounded-md">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-16 text-center">Pos</TableHead>
              <TableHead>Piloto</TableHead>
              <TableHead>Equipe</TableHead>
              <TableHead className="text-right">Melhor Volta</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((driver) => {
              const isExpanded = expandedDriver === driver.driverNumber

              return (
                <React.Fragment key={driver.driverNumber}>
                  <TableRow className={`hover:bg-gray-50 ${isExpanded ? "bg-gray-100" : ""}`}>
                    <TableCell
                      className="font-medium text-center cursor-pointer"
                      onClick={() => toggleDriverDetails(driver.driverNumber)}
                    >
                      <div className="flex items-center justify-center">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 mr-1" />
                        ) : (
                          <ChevronRight className="h-4 w-4 mr-1" />
                        )}
                        {driver.position}
                      </div>
                    </TableCell>
                    <TableCell onClick={() => toggleDriverDetails(driver.driverNumber)} className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                          <Image
                            src={driver.headshotUrl || `/placeholder.svg?height=32&width=32&query=driver`}
                            alt={driver.fullName}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-medium">{driver.fullName}</div>
                          <div className="text-xs text-muted-foreground">{driver.driverNumber}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell onClick={() => toggleDriverDetails(driver.driverNumber)} className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-6 rounded-sm" style={{ backgroundColor: `#${driver.teamColor}` }}></div>
                        <span className="font-medium">{driver.teamName}</span>
                        <div className="relative w-24 h-10 hidden md:block">
                          <Image
                            src={`/images/teams/${driver.teamName.toLowerCase().replace(/\s+/g, "")}.png`}
                            alt={driver.teamName}
                            fill
                            className="object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.src = "/images/teams/placeholder-team.png"
                            }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell
                      className="text-right font-mono text-green-600"
                      onClick={() => toggleDriverDetails(driver.driverNumber)}
                    >
                      {formatLapTime(driver.bestLapTime)}
                    </TableCell>
                  </TableRow>

                  {/* Área expandida com detalhes do piloto */}
                  {isExpanded && (
                    <TableRow>
                      <TableCell colSpan={4} className="p-0 bg-gray-50 border-t border-gray-200">
                        {driverDetails.isLoading ? (
                          <div className="p-4 text-center">
                            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                            <p className="mt-2 text-sm text-gray-500">Carregando dados do piloto...</p>
                          </div>
                        ) : driverDetails.allLaps.length > 0 ? (
                          <div className="p-4">
                            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
                              <TabsList className="w-full grid grid-cols-4">
                                <TabsTrigger value="setores">Setores</TabsTrigger>
                                <TabsTrigger value="stint">Stint</TabsTrigger>
                                <TabsTrigger value="pit">Pit</TabsTrigger>
                                <TabsTrigger value="radio">Team Radio</TabsTrigger>
                              </TabsList>

                              <TabsContent value="setores" className="mt-4">
                                {driverDetails.bestLap ? (
                                  <>
                                    <div className="flex justify-between items-center mb-4">
                                      <div className="text-sm font-medium">
                                        Detalhes da Volta {driverDetails.bestLap.lap_number}{" "}
                                        <span className="text-green-600">(Melhor Volta)</span>
                                      </div>
                                      <div className="text-sm">
                                        Tempo Total:{" "}
                                        <span className="font-mono text-green-600">
                                          {formatLapTime(driverDetails.bestLap.lap_duration || 0)}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                      <div className="border rounded-md p-3">
                                        <div className="text-sm font-medium mb-1">Setor 1</div>
                                        <div className="font-mono text-purple-600 text-lg">
                                          {formatLapTime(driverDetails.bestLap.duration_sector_1 || 0)}
                                        </div>
                                        <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
                                          <span>Velocidade I1</span>
                                          <span>
                                            {driverDetails.bestLap.i1_speed
                                              ? `${driverDetails.bestLap.i1_speed} km/h`
                                              : "-"}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="border rounded-md p-3">
                                        <div className="text-sm font-medium mb-1">Setor 2</div>
                                        <div className="font-mono text-purple-600 text-lg">
                                          {formatLapTime(driverDetails.bestLap.duration_sector_2 || 0)}
                                        </div>
                                        <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
                                          <span>Velocidade I2</span>
                                          <span>
                                            {driverDetails.bestLap.i2_speed
                                              ? `${driverDetails.bestLap.i2_speed} km/h`
                                              : "-"}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="border rounded-md p-3">
                                        <div className="text-sm font-medium mb-1">Setor 3</div>
                                        <div className="font-mono text-purple-600 text-lg">
                                          {formatLapTime(driverDetails.bestLap.duration_sector_3 || 0)}
                                        </div>
                                        <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
                                          <span>Velocidade ST</span>
                                          <span>
                                            {driverDetails.bestLap.st_speed
                                              ? `${driverDetails.bestLap.st_speed} km/h`
                                              : "-"}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="mt-4">
                                      <div className="text-sm font-medium mb-2">Voltas da Corrida</div>
                                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 max-h-40 overflow-y-auto">
                                        {driverDetails.allLaps.map((lap) => (
                                          <div
                                            key={`lap-${lap.lap_number}`}
                                            className="flex justify-between items-center py-1 px-2 text-sm border-b"
                                          >
                                            <div className="flex items-center gap-1">
                                              <span>Volta {lap.lap_number}</span>
                                              <TyreIndicator compound={lap.compound || "MEDIUM"} size="xs" />
                                            </div>
                                            <span className="font-mono">
                                              {lap.lap_duration ? formatLapTime(lap.lap_duration) : "Sem tempo"}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-center py-4 text-gray-500">
                                    Nenhum detalhe de setor disponível para este piloto
                                  </div>
                                )}
                              </TabsContent>

                              <TabsContent value="stint" className="mt-4">
                                {driverDetails.stints.length > 0 ? (
                                  <table className="w-full border-collapse">
                                    <thead>
                                      <tr className="bg-gray-50">
                                        <th className="py-2 px-3 text-left text-sm font-medium">Stint</th>
                                        <th className="py-2 px-3 text-left text-sm font-medium">Composto</th>
                                        <th className="py-2 px-3 text-left text-sm font-medium">Voltas</th>
                                        <th className="py-2 px-3 text-left text-sm font-medium">Total</th>
                                        <th className="py-2 px-3 text-left text-sm font-medium">Melhor Volta</th>
                                        <th className="py-2 px-3 text-left text-sm font-medium">Setor 1</th>
                                        <th className="py-2 px-3 text-left text-sm font-medium">Setor 2</th>
                                        <th className="py-2 px-3 text-left text-sm font-medium">Setor 3</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {driverDetails.stints.map((stint) => {
                                        // Calcular a melhor volta deste stint
                                        const stintLaps = driverDetails.allLaps.filter(
                                          (lap) => lap.lap_number >= stint.lap_start && lap.lap_number <= stint.lap_end,
                                        )

                                        // Ordenar por tempo de volta para encontrar a melhor
                                        const bestStintLap =
                                          stintLaps.length > 0
                                            ? [...stintLaps].sort(
                                                (a, b) =>
                                                  (a.lap_duration || Number.POSITIVE_INFINITY) -
                                                  (b.lap_duration || Number.POSITIVE_INFINITY),
                                              )[0]
                                            : null

                                        return (
                                          <tr key={`stint-${stint.stint_number}`} className="border-b">
                                            <td className="py-2 px-3 text-sm">Stint {stint.stint_number}</td>
                                            <td className="py-2 px-3">
                                              <div className="inline-block px-2 py-1 bg-yellow-100 text-xs font-medium rounded">
                                                {stint.compound}
                                              </div>
                                            </td>
                                            <td className="py-2 px-3 text-sm">
                                              Voltas {stint.lap_start} - {stint.lap_end}
                                            </td>
                                            <td className="py-2 px-3 text-sm">
                                              {stint.lap_end - stint.lap_start + 1} voltas
                                            </td>
                                            <td className="py-2 px-3 font-mono text-sm text-green-600">
                                              {bestStintLap?.lap_duration
                                                ? formatLapTime(bestStintLap.lap_duration)
                                                : "-"}
                                            </td>
                                            <td className="py-2 px-3 font-mono text-sm">
                                              {bestStintLap?.duration_sector_1
                                                ? formatLapTime(bestStintLap.duration_sector_1)
                                                : "-"}
                                            </td>
                                            <td className="py-2 px-3 font-mono text-sm">
                                              {bestStintLap?.duration_sector_2
                                                ? formatLapTime(bestStintLap.duration_sector_2)
                                                : "-"}
                                            </td>
                                            <td className="py-2 px-3 font-mono text-sm">
                                              {bestStintLap?.duration_sector_3
                                                ? formatLapTime(bestStintLap.duration_sector_3)
                                                : "-"}
                                            </td>
                                          </tr>
                                        )
                                      })}
                                    </tbody>
                                  </table>
                                ) : (
                                  <div className="text-center py-4 text-gray-500">
                                    Nenhum dado de stint disponível para este piloto
                                  </div>
                                )}
                              </TabsContent>

                              <TabsContent value="pit" className="mt-4">
                                <div className="space-y-4">
                                  <div className="flex justify-between items-center">
                                    <div className="text-sm font-medium flex items-center">
                                      <Clock className="h-4 w-4 mr-1" />
                                      Pit Stops
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      Total: {driverDetails.pitStops.length} pit stops
                                    </div>
                                  </div>

                                  {driverDetails.pitStops.length > 0 ? (
                                    <div className="space-y-3">
                                      {driverDetails.pitStops.map((pitStop, index) => (
                                        <div
                                          key={index}
                                          className="border rounded-md p-3 hover:bg-gray-50 transition-colors"
                                        >
                                          <div className="flex justify-between items-center mb-2">
                                            <div className="font-medium">
                                              Pit Stop {index + 1} - Volta {pitStop.lap_number}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                              {pitStop.date?.$date ? formatDate(pitStop.date.$date) : ""}
                                            </div>
                                          </div>
                                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                                            <div className="flex flex-col">
                                              <span className="text-xs text-muted-foreground">Tempo Total</span>
                                              <span className="font-mono text-lg">
                                                {formatPitTime(pitStop.total_duration)}
                                              </span>
                                            </div>
                                            <div className="flex flex-col">
                                              <span className="text-xs text-muted-foreground">Tempo Parado</span>
                                              <span className="font-mono text-lg">
                                                {formatPitTime(pitStop.pit_duration)}
                                              </span>
                                            </div>
                                            <div className="flex flex-col">
                                              <span className="text-xs text-muted-foreground">Troca de Pneus</span>
                                              <div className="flex items-center gap-2 mt-1">
                                                <TyreIndicator
                                                  compound={pitStop.previous_compound || "UNKNOWN"}
                                                  size="xs"
                                                />
                                                <span className="text-xs">→</span>
                                                <TyreIndicator compound={pitStop.new_compound || "UNKNOWN"} size="xs" />
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-center py-4 text-gray-500">
                                      Nenhum pit stop registrado para este piloto
                                    </div>
                                  )}
                                </div>
                              </TabsContent>

                              <TabsContent value="radio" className="mt-4">
                                <div className="space-y-4">
                                  <div className="flex justify-between items-center">
                                    <div className="text-sm font-medium flex items-center">
                                      <MessageSquare className="h-4 w-4 mr-1" />
                                      Mensagens de Rádio
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="text-xs text-muted-foreground">
                                        Total: {driverDetails.radioMessages.length} mensagens
                                      </div>
                                      <button className="text-xs flex items-center gap-1 text-gray-500 hover:text-gray-700">
                                        <Filter className="h-3 w-3" />
                                        Filtrar
                                      </button>
                                    </div>
                                  </div>

                                  {driverDetails.radioMessages.length > 0 ? (
                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                      {driverDetails.radioMessages.map((message, index) => (
                                        <div
                                          key={index}
                                          className={`border rounded-md p-3 ${
                                            message.direction === "from_driver"
                                              ? "bg-blue-50 border-blue-100"
                                              : "bg-gray-50 border-gray-100"
                                          }`}
                                        >
                                          <div className="flex justify-between items-center mb-1">
                                            <div className="text-sm font-medium">Volta {message.lap_number}</div>
                                            <div className="text-xs text-muted-foreground">
                                              {message.date?.$date ? formatDate(message.date.$date) : ""}
                                            </div>
                                          </div>
                                          <div className="text-sm">"{message.message}"</div>
                                          <div className="text-xs text-muted-foreground mt-1">
                                            {message.direction === "from_driver"
                                              ? "Piloto → Engenheiro"
                                              : "Engenheiro → Piloto"}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-center py-4 text-gray-500">
                                      Nenhuma mensagem de rádio disponível para este piloto
                                    </div>
                                  )}
                                </div>
                              </TabsContent>
                            </Tabs>
                          </div>
                        ) : (
                          <div className="p-6 text-center text-gray-500">
                            Nenhum detalhe disponível para este piloto
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
