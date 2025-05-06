"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { formatLapTime } from "@/lib/utils"
import type { RaceResult, Lap, Stint } from "@/lib/types"
import { TyreIndicator } from "./tyre-indicator"
import Image from "next/image"
import { useRouter } from "next/navigation"

interface RaceResultsProps {
  sessionId: string
  sessionType: string // Pode ser "Race" ou "Sprint"
}

export function RaceResults({ sessionId, sessionType }: RaceResultsProps) {
  const [results, setResults] = useState<RaceResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDriver, setSelectedDriver] = useState<RaceResult | null>(null)
  const [driverLaps, setDriverLaps] = useState<Lap[]>([])
  const [driverStints, setDriverStints] = useState<Stint[]>([])
  const [loadingLaps, setLoadingLaps] = useState(false)
  const [loadingStints, setLoadingStints] = useState(false)
  const router = useRouter()

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

        // Selecionar o primeiro piloto por padrão
        if (data.length > 0) {
          setSelectedDriver(data[0])
          fetchDriverLaps(data[0].driverNumber)
          fetchDriverStints(data[0].driverNumber)
        }
      } catch (err) {
        console.error("Erro ao buscar resultados da corrida:", err)
        setError("Não foi possível carregar os resultados da corrida.")
      } finally {
        setLoading(false)
      }
    }

    fetchRaceResults()
  }, [sessionId])

  async function fetchDriverLaps(driverNumber: number) {
    try {
      setLoadingLaps(true)
      console.log(`Buscando voltas para o piloto ${driverNumber}`)

      // Garantir que driverNumber seja uma string na URL
      const response = await fetch(`/api/sessions/${sessionId}/driver/${driverNumber}/laps`)

      if (!response.ok) {
        console.error(`Erro ao buscar voltas: ${response.status}`)
        setDriverLaps([])
        return
      }

      const data = await response.json()
      console.log(`Recebidas ${data.length} voltas para o piloto ${driverNumber}`)
      setDriverLaps(data)
    } catch (err) {
      console.error("Erro ao buscar voltas do piloto:", err)
      setDriverLaps([])
    } finally {
      setLoadingLaps(false)
    }
  }

  async function fetchDriverStints(driverNumber: number) {
    try {
      setLoadingStints(true)
      const response = await fetch(`/api/sessions/${sessionId}/driver/${driverNumber}/stints`)

      if (!response.ok) {
        console.error(`Erro ao buscar stints: ${response.status}`)
        setDriverStints([])
        return
      }

      const data = await response.json()
      setDriverStints(data)
    } catch (err) {
      console.error("Erro ao buscar stints do piloto:", err)
      setDriverStints([])
    } finally {
      setLoadingStints(false)
    }
  }

  // Encontrar os melhores tempos de setor para destacar
  const bestSector1 =
    results.length > 0
      ? Math.min(...results.filter((d) => d.sector1Time !== null).map((d) => d.sector1Time || Number.POSITIVE_INFINITY))
      : 0

  const bestSector2 =
    results.length > 0
      ? Math.min(...results.filter((d) => d.sector2Time !== null).map((d) => d.sector2Time || Number.POSITIVE_INFINITY))
      : 0

  const bestSector3 =
    results.length > 0
      ? Math.min(...results.filter((d) => d.sector3Time !== null).map((d) => d.sector3Time || Number.POSITIVE_INFINITY))
      : 0

  const handleDriverClick = (driver: RaceResult) => {
    setSelectedDriver(driver)
    fetchDriverLaps(driver.driverNumber)
    fetchDriverStints(driver.driverNumber)
  }

  const navigateToDriverDetails = (driverNumber: number) => {
    router.push(`/session/${sessionId}/driver/${driverNumber}`)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
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

  // Encontrar a melhor volta do piloto selecionado
  const bestLap = selectedDriver?.bestLapNumber
    ? driverLaps.find((lap) => lap.lap_number === selectedDriver.bestLapNumber)
    : null

  // Organizar as voltas por stint
  const stintLaps: Record<number, Lap[]> = {}
  if (driverStints.length > 0 && driverLaps.length > 0) {
    driverStints.forEach((stint) => {
      stintLaps[stint.stint_number] = driverLaps.filter(
        (lap) => lap.lap_number >= stint.lap_start && lap.lap_number <= stint.lap_end,
      )
    })
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-0 shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800">
                <TableHead className="w-12 text-center">Pos</TableHead>
                <TableHead className="w-8 px-2">
                  <Checkbox className="opacity-0 pointer-events-none" />
                </TableHead>
                <TableHead>Piloto</TableHead>
                <TableHead>Equipe</TableHead>
                <TableHead className="text-right">Melhor Volta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((driver) => (
                <TableRow
                  key={driver.driverNumber}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${
                    selectedDriver?.driverNumber === driver.driverNumber ? "bg-gray-100 dark:bg-gray-700" : ""
                  }`}
                  onClick={() => handleDriverClick(driver)}
                >
                  <TableCell className="font-medium text-center">{driver.position}</TableCell>
                  <TableCell className="px-2">
                    <Checkbox
                      checked={selectedDriver?.driverNumber === driver.driverNumber}
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                        <Image
                          src={driver.headshotUrl || `/placeholder.svg?height=32&width=32&query=driver`}
                          alt={driver.fullName || driver.nameAcronym}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-medium">{driver.fullName || driver.nameAcronym}</div>
                        <div className="text-xs text-muted-foreground">{driver.driverNumber}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-1 h-6 rounded-sm"
                        style={{ backgroundColor: `#${driver.teamColor}` || "#ccc" }}
                      ></div>
                      <div className="flex items-center gap-2">
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
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-green-600">
                    {driver.bestLapTime ? formatLapTime(driver.bestLapTime) : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {selectedDriver && (
        <div className="grid grid-cols-1 gap-4">
          <div className="text-sm text-muted-foreground">Voltas da Corrida</div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1 overflow-hidden border rounded-md">
              {loadingLaps ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : driverLaps.length > 0 ? (
                <div className="max-h-[300px] overflow-y-auto">
                  <Table>
                    <TableBody>
                      {driverLaps.map((lap) => (
                        <TableRow key={lap.lap_number} className="hover:bg-gray-50">
                          <TableCell className="py-1">
                            <div className="flex items-center">
                              <span className="w-14">Volta {lap.lap_number}</span>
                              <div className="mx-2">
                                <TyreIndicator compound={lap.compound || "UNKNOWN"} size="xs" />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right py-1 font-mono">
                            {lap.lap_duration ? formatLapTime(lap.lap_duration) : "Sem tempo"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">Nenhuma volta disponível para este piloto</div>
              )}
            </div>

            <div className="md:col-span-2">
              <Tabs defaultValue="setores" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="setores">Setores</TabsTrigger>
                  <TabsTrigger value="stint">Stint</TabsTrigger>
                  <TabsTrigger value="pit">Pit</TabsTrigger>
                  <TabsTrigger value="radio">Team Radio</TabsTrigger>
                </TabsList>

                <TabsContent value="setores" className="border rounded-md mt-2">
                  {bestLap && (
                    <div className="p-4">
                      <div className="flex justify-between items-center mb-4">
                        <div className="text-sm font-medium">
                          Detalhes da Volta {selectedDriver.bestLapNumber}{" "}
                          <span className="text-green-600">(Melhor Volta)</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Tempo Total:{" "}
                          <span className="font-mono text-green-600">{formatLapTime(selectedDriver.bestLapTime!)}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="border rounded-md p-4 bg-purple-50">
                          <div className="text-sm font-medium mb-1">Setor 1</div>
                          <div className="font-mono text-xl text-purple-700">
                            {selectedDriver.sector1Time ? formatLapTime(selectedDriver.sector1Time) : "-"}
                          </div>
                          <div className="mt-2 text-sm text-muted-foreground flex justify-between">
                            <span>Velocidade I1</span>
                            <span>{selectedDriver.i1Speed ? `${Math.round(selectedDriver.i1Speed)} km/h` : "-"}</span>
                          </div>
                        </div>

                        <div className="border rounded-md p-4 bg-purple-50">
                          <div className="text-sm font-medium mb-1">Setor 2</div>
                          <div className="font-mono text-xl text-purple-700">
                            {selectedDriver.sector2Time ? formatLapTime(selectedDriver.sector2Time) : "-"}
                          </div>
                          <div className="mt-2 text-sm text-muted-foreground flex justify-between">
                            <span>Velocidade I2</span>
                            <span>{selectedDriver.i2Speed ? `${Math.round(selectedDriver.i2Speed)} km/h` : "-"}</span>
                          </div>
                        </div>

                        <div className="border rounded-md p-4 bg-purple-50">
                          <div className="text-sm font-medium mb-1">Setor 3</div>
                          <div className="font-mono text-xl text-purple-700">
                            {selectedDriver.sector3Time ? formatLapTime(selectedDriver.sector3Time) : "-"}
                          </div>
                          <div className="mt-2 text-sm text-muted-foreground flex justify-between">
                            <span>Velocidade ST</span>
                            <span>{selectedDriver.stSpeed ? `${Math.round(selectedDriver.stSpeed)} km/h` : "-"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="stint" className="border rounded-md mt-2">
                  <div className="p-4">
                    {loadingStints ? (
                      <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                      </div>
                    ) : driverStints.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Stint</TableHead>
                            <TableHead>Composto</TableHead>
                            <TableHead>Voltas</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Melhor Volta</TableHead>
                            <TableHead>Setor 1</TableHead>
                            <TableHead>Setor 2</TableHead>
                            <TableHead>Setor 3</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {driverStints.map((stint) => {
                            const stintLapsList = stintLaps[stint.stint_number] || []
                            const bestStintLap =
                              stintLapsList.length > 0
                                ? stintLapsList.reduce(
                                    (best, current) =>
                                      current.lap_duration &&
                                      best.lap_duration &&
                                      current.lap_duration < best.lap_duration
                                        ? current
                                        : best,
                                    stintLapsList[0],
                                  )
                                : null

                            return (
                              <TableRow key={stint.stint_number}>
                                <TableCell>Stint {stint.stint_number}</TableCell>
                                <TableCell>
                                  <div className="inline-block px-2 py-1 rounded bg-yellow-100 text-xs font-medium">
                                    {stint.compound}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  Voltas {stint.lap_start} - {stint.lap_end}
                                </TableCell>
                                <TableCell>{stint.lap_end - stint.lap_start + 1} voltas</TableCell>
                                <TableCell className="font-mono text-green-600">
                                  {bestStintLap?.lap_duration ? formatLapTime(bestStintLap.lap_duration) : "-"}
                                </TableCell>
                                <TableCell className="font-mono">
                                  {bestStintLap?.duration_sector_1
                                    ? formatLapTime(bestStintLap.duration_sector_1)
                                    : "-"}
                                </TableCell>
                                <TableCell className="font-mono">
                                  {bestStintLap?.duration_sector_2
                                    ? formatLapTime(bestStintLap.duration_sector_2)
                                    : "-"}
                                </TableCell>
                                <TableCell className="font-mono">
                                  {bestStintLap?.duration_sector_3
                                    ? formatLapTime(bestStintLap.duration_sector_3)
                                    : "-"}
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        Nenhum stint disponível para este piloto
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="pit" className="border rounded-md mt-2">
                  <div className="p-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Pit Stop</TableHead>
                          <TableHead>Volta</TableHead>
                          <TableHead>Tempo Total</TableHead>
                          <TableHead>Tempo Parado</TableHead>
                          <TableHead>Pneu Anterior</TableHead>
                          <TableHead>Pneu Novo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                            Nenhum pit stop registrado para este piloto
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="radio" className="border rounded-md mt-2">
                  <div className="p-4">
                    <div className="space-y-4">
                      <div className="text-center py-4 text-muted-foreground">
                        Nenhuma mensagem de rádio disponível para este piloto
                      </div>
                      {/* Quando houver dados, usar este formato:
                      <div className="border rounded-md p-3">
                        <div className="flex justify-between items-center mb-1">
                          <div className="text-sm font-medium">Volta 24</div>
                          <div className="text-xs text-muted-foreground">12:45:32</div>
                        </div>
                        <div className="text-sm">
                          "Box, box, box this lap. Confirm."
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Engenheiro → Piloto</div>
                      </div>
                      */}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
