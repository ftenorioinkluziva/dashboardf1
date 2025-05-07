"use client"

import React, { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fetchRaceStandings, fetchDriverData } from "@/lib/client-data"
import { Skeleton } from "@/components/ui/skeleton"
import Image from "next/image"
import { ChevronDown, ChevronRight, BarChart2, Users } from "lucide-react"
import { LapTimeDisplay } from "./lap-time-display"
import { DriverComparison } from "./driver-comparison/driver-comparison"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatLapTime } from "@/lib/utils"
import type { DriverStanding, Lap } from "@/lib/types"

interface RaceStandingsProps {
  sessionId: string
}

export function RaceStandings({ sessionId }: RaceStandingsProps) {
  const [standings, setStandings] = useState<DriverStanding[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedDriver, setExpandedDriver] = useState<number | null>(null)
  const [driverDetails, setDriverDetails] = useState<{
    bestLap: Lap | null
    allLaps: Lap[]
    stints: any[]
    isLoading: boolean
  }>({
    bestLap: null,
    allLaps: [],
    stints: [],
    isLoading: false,
  })
  const [selectedLap, setSelectedLap] = useState<Lap | null>(null)
  const [selectedDrivers, setSelectedDrivers] = useState<number[]>([])
  const [showComparison, setShowComparison] = useState(false)

  useEffect(() => {
    async function loadStandings() {
      try {
        setLoading(true)
        const data = await fetchRaceStandings(sessionId)
        setStandings(data)
      } catch (error) {
        console.error("Erro ao carregar classificação:", error)
      } finally {
        setLoading(false)
      }
    }

    loadStandings()
  }, [sessionId])

  const toggleDriverDetails = async (driverNumber: number) => {
    if (expandedDriver === driverNumber) {
      // Se já está expandido, fechamos
      setExpandedDriver(null)
      return
    }

    // Expandir e carregar os detalhes
    setExpandedDriver(driverNumber)
    setDriverDetails({ bestLap: null, allLaps: [], stints: [], isLoading: true })
    setSelectedLap(null)

    try {
      // Buscar dados detalhados do piloto
      const driverData = await fetchDriverData(sessionId, driverNumber.toString())

      // Encontrar a melhor volta
      const bestLap = driverData.laps.find((lap) => lap.lap_number === driverData.bestLapInfo.bestLapNumber) || null

      // Ordenar as voltas por número
      const sortedLaps = [...driverData.laps].sort((a, b) => a.lap_number - b.lap_number)

      setDriverDetails({
        bestLap,
        allLaps: sortedLaps,
        stints: driverData.stints || [],
        isLoading: false,
      })

      // Selecionar a melhor volta por padrão
      setSelectedLap(bestLap)
    } catch (error) {
      console.error("Erro ao carregar detalhes do piloto:", error)
      setDriverDetails({ bestLap: null, allLaps: [], stints: [], isLoading: false })
    }
  }

  const toggleDriverSelection = (driverNumber: number) => {
    setSelectedDrivers((prev) => {
      if (prev.includes(driverNumber)) {
        return prev.filter((d) => d !== driverNumber)
      } else {
        // Allow multiple drivers (no limit)
        return [...prev, driverNumber]
      }
    })
  }

  // Obter pilotos selecionados para comparação
  const driversToCompare = standings.filter((driver) => selectedDrivers.includes(driver.driverNumber))

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h3 className="font-medium">Classificação da Sessão</h3>
        </div>
        <div className="p-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={`skeleton-${index}`} className="h-12 w-full mb-2" />
          ))}
        </div>
      </div>
    )
  }

  if (standings.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h3 className="font-medium">Classificação da Sessão</h3>
        </div>
        <div className="p-4">
          <div className="text-center py-8 text-muted-foreground">Nenhum dado de classificação disponível</div>
        </div>
      </div>
    )
  }

  // Encontrar o tempo do líder para calcular as diferenças
  const leaderTime = standings[0].bestLapTime

  // Encontrar os melhores tempos de setor para comparação
  const bestSector1 = Math.min(
    ...standings.filter((d) => d.sector1Time !== null).map((d) => d.sector1Time || Number.POSITIVE_INFINITY),
  )
  const bestSector2 = Math.min(
    ...standings.filter((d) => d.sector2Time !== null).map((d) => d.sector2Time || Number.POSITIVE_INFINITY),
  )
  const bestSector3 = Math.min(
    ...standings.filter((d) => d.sector3Time !== null).map((d) => d.sector3Time || Number.POSITIVE_INFINITY),
  )

  // Determinar qual volta mostrar nos detalhes
  const lapToShow = selectedLap || driverDetails.bestLap

  return (
    <div className="space-y-4">
      {/* Controles de comparação */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex justify-between items-center">
          <h3 className="font-medium">Classificação da Sessão</h3>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowComparison(!showComparison)}
              disabled={selectedDrivers.length < 2}
              className="flex items-center gap-2"
            >
              {showComparison ? <Users className="h-4 w-4" /> : <BarChart2 className="h-4 w-4" />}
              {showComparison ? "Ocultar Comparação" : "Comparar Selecionados"}
            </Button>

            {selectedDrivers.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setSelectedDrivers([])} className="h-8 px-2 text-xs">
                Limpar seleção ({selectedDrivers.length})
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Componente de comparação */}
      {showComparison && selectedDrivers.length >= 2 && (
        <DriverComparison drivers={driversToCompare} onClose={() => setShowComparison(false)} sessionId={sessionId} />
      )}

      {/* Tabela principal */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h3 className="font-medium">Classificação da Sessão</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-10"></TableHead>
                <TableHead className="w-16 text-center font-medium">Pos</TableHead>
                <TableHead className="font-medium">Piloto</TableHead>
                <TableHead className="font-medium">Equipe</TableHead>
                <TableHead className="font-medium">Melhor Volta</TableHead>
                <TableHead className="font-medium">Diferença</TableHead>
                <TableHead className="font-medium">Velocidade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {standings.map((driver, index) => {
                // Calcular a diferença para o líder
                const gap = driver.bestLapTime - leaderTime
                const gapText = index === 0 ? "LÍDER" : `+${gap.toFixed(3)}`

                // Determinar a cor da linha com base na posição (par/ímpar)
                const rowColorClass = index % 2 === 0 ? "bg-gray-50" : "bg-white"
                const isExpanded = expandedDriver === driver.driverNumber
                const isSelected = selectedDrivers.includes(driver.driverNumber)

                // Usar uma combinação de driverNumber e index para garantir chaves únicas
                const uniqueKey = `driver-${driver.driverNumber}-${index}`

                return (
                  <React.Fragment key={uniqueKey}>
                    <TableRow
                      className={`hover:bg-gray-100 ${isExpanded ? "bg-gray-100" : ""} ${
                        isSelected ? "bg-blue-50" : ""
                      }`}
                    >
                      <TableCell className="p-2">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleDriverSelection(driver.driverNumber)}
                          aria-label={`Selecionar ${driver.fullName}`}
                        />
                      </TableCell>
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
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{driver.teamName}</span>
                            <div className="relative w-24 h-10 hidden md:block">
                              <Image
                                src={`/images/teams/${driver.teamName.toLowerCase().replace(/\s+/g, "")}.png`}
                                alt={driver.teamName}
                                fill
                                className="object-contain"
                                onError={(e) => {
                                  // Fallback para imagem padrão se a imagem da equipe não existir
                                  const target = e.target as HTMLImageElement
                                  target.src = "/images/teams/placeholder-team.png"
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell
                        className="font-mono font-medium text-green-600 cursor-pointer"
                        onClick={() => toggleDriverDetails(driver.driverNumber)}
                      >
                        <LapTimeDisplay time={driver.bestLapTime} isPersonalBest={index === 0} />
                      </TableCell>
                      <TableCell
                        className="font-mono font-medium cursor-pointer"
                        onClick={() => toggleDriverDetails(driver.driverNumber)}
                      >
                        {index === 0 ? (
                          <span className="font-bold">LÍDER</span>
                        ) : (
                          <span className="text-gray-700">+{gap.toFixed(3)}</span>
                        )}
                      </TableCell>
                      <TableCell
                        className="font-mono font-medium cursor-pointer"
                        onClick={() => toggleDriverDetails(driver.driverNumber)}
                      >
                        {driver.bestLapSpeed ? `${driver.bestLapSpeed} km/h` : ""}
                      </TableCell>
                    </TableRow>

                    {/* Detalhes expandidos */}
                    {isExpanded && (
                      <TableRow className="bg-gray-50">
                        <TableCell colSpan={7} className="p-4">
                          {driverDetails.isLoading ? (
                            <div className="space-y-4">
                              <Skeleton className="h-20 w-full" />
                              <Skeleton className="h-16 w-full" />
                            </div>
                          ) : lapToShow ? (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                              {/* Coluna 1: Lista de voltas */}
                              <div className="md:col-span-1">
                                <h4 className="text-sm font-medium mb-2">Voltas da Sessão</h4>
                                <ScrollArea className="h-[300px] border rounded-md">
                                  <div className="p-2">
                                    {driverDetails.allLaps.map((lap) => (
                                      <div
                                        key={lap.lap_number}
                                        className={`p-2 mb-1 rounded-md cursor-pointer hover:bg-gray-100 ${
                                          selectedLap?.lap_number === lap.lap_number
                                            ? "bg-blue-50 border border-blue-200"
                                            : ""
                                        } ${lap.lap_number === driverDetails.bestLap?.lap_number ? "font-medium" : ""}`}
                                        onClick={() => setSelectedLap(lap)}
                                      >
                                        <div className="flex justify-between items-center">
                                          <div className="flex items-center">
                                            <span className="text-sm">Volta {lap.lap_number}</span>
                                            {lap.compound && (
                                              <span
                                                className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                                                  lap.compound === "SOFT"
                                                    ? "bg-red-100 text-red-800"
                                                    : lap.compound === "MEDIUM"
                                                      ? "bg-yellow-100 text-yellow-800"
                                                      : lap.compound === "HARD"
                                                        ? "bg-gray-100 text-gray-800"
                                                        : lap.compound === "INTERMEDIATE"
                                                          ? "bg-green-100 text-green-800"
                                                          : "bg-blue-100 text-blue-800"
                                                }`}
                                              >
                                                {lap.compound}
                                              </span>
                                            )}
                                          </div>
                                          <span className="text-sm font-mono">
                                            {lap.lap_duration ? (
                                              <LapTimeDisplay
                                                time={lap.lap_duration}
                                                isPersonalBest={lap.lap_number === driverDetails.bestLap?.lap_number}
                                              />
                                            ) : (
                                              <span className="text-gray-400">Sem tempo</span>
                                            )}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </ScrollArea>
                              </div>

                              {/* Coluna 2-4: Detalhes da volta */}
                              <div className="md:col-span-3 space-y-4">
                                <Tabs defaultValue="sectors" className="w-full">
                                  <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="sectors">Setores</TabsTrigger>
                                    <TabsTrigger value="stint">Stint</TabsTrigger>
                                  </TabsList>

                                  <TabsContent value="sectors" className="pt-4">
                                    <div className="mb-4">
                                      <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-sm font-medium">
                                          Detalhes da Volta {lapToShow.lap_number}
                                          {lapToShow.lap_number === driverDetails.bestLap?.lap_number && (
                                            <span className="ml-2 text-green-600 text-xs">(Melhor Volta)</span>
                                          )}
                                        </h4>
                                        <div className="text-right">
                                          <div className="text-sm font-medium">
                                            Tempo Total:{" "}
                                            <span className="font-mono text-green-600">
                                              {formatLapTime(lapToShow.lap_duration || 0)}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                      <div className="border rounded-md p-3">
                                        <div className="text-sm font-medium mb-1">Setor 1</div>
                                        <div className="flex items-center justify-between">
                                          <span
                                            className={`font-mono text-base py-1 px-2 rounded ${lapToShow.duration_sector_1 === bestSector1 ? "bg-purple-100" : ""}`}
                                          >
                                            {formatLapTime(lapToShow.duration_sector_1 || 0)}
                                          </span>
                                          {bestSector1 !== null &&
                                            lapToShow.duration_sector_1 !== null &&
                                            lapToShow.duration_sector_1 !== bestSector1 && (
                                              <div className="text-xs">
                                                <span className="text-gray-600">
                                                  +{(lapToShow.duration_sector_1 - bestSector1).toFixed(3)}s
                                                </span>
                                              </div>
                                            )}
                                        </div>
                                        <div className="mt-2 text-sm">
                                          <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-500">Velocidade I1</span>
                                            <span className="font-mono">
                                              {lapToShow.i1_speed ? `${lapToShow.i1_speed} km/h` : "-"}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="border rounded-md p-3">
                                        <div className="text-sm font-medium mb-1">Setor 2</div>
                                        <div className="flex items-center justify-between">
                                          <span
                                            className={`font-mono text-base py-1 px-2 rounded ${lapToShow.duration_sector_2 === bestSector2 ? "bg-purple-100" : ""}`}
                                          >
                                            {formatLapTime(lapToShow.duration_sector_2 || 0)}
                                          </span>
                                          {bestSector2 !== null &&
                                            lapToShow.duration_sector_2 !== null &&
                                            lapToShow.duration_sector_2 !== bestSector2 && (
                                              <div className="text-xs">
                                                <span className="text-gray-600">
                                                  +{(lapToShow.duration_sector_2 - bestSector2).toFixed(3)}s
                                                </span>
                                              </div>
                                            )}
                                        </div>
                                        <div className="mt-2 text-sm">
                                          <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-500">Velocidade I2</span>
                                            <span className="font-mono">
                                              {lapToShow.i2_speed ? `${lapToShow.i2_speed} km/h` : "-"}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="border rounded-md p-3">
                                        <div className="text-sm font-medium mb-1">Setor 3</div>
                                        <div className="flex items-center justify-between">
                                          <span
                                            className={`font-mono text-base py-1 px-2 rounded ${lapToShow.duration_sector_3 === bestSector3 ? "bg-purple-100" : ""}`}
                                          >
                                            {formatLapTime(lapToShow.duration_sector_3 || 0)}
                                          </span>
                                          {bestSector3 !== null &&
                                            lapToShow.duration_sector_3 !== null &&
                                            lapToShow.duration_sector_3 !== bestSector3 && (
                                              <div className="text-xs">
                                                <span className="text-gray-600">
                                                  +{(lapToShow.duration_sector_3 - bestSector3).toFixed(3)}s
                                                </span>
                                              </div>
                                            )}
                                        </div>
                                        <div className="mt-2 text-sm">
                                          <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-500">Velocidade ST</span>
                                            <span className="font-mono">
                                              {lapToShow.st_speed ? `${lapToShow.st_speed} km/h` : "-"}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </TabsContent>

                                  <TabsContent value="stint" className="pt-4">
                                    {driverDetails.stints && driverDetails.stints.length > 0 ? (
                                      <div className="overflow-x-auto">
                                        <table className="w-full border-collapse">
                                          <thead className="bg-gray-100">
                                            <tr>
                                              <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">
                                                Stint
                                              </th>
                                              <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">
                                                Composto
                                              </th>
                                              <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">
                                                Voltas
                                              </th>
                                              <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">
                                                Total
                                              </th>
                                              <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">
                                                Melhor Volta
                                              </th>
                                              <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">
                                                Setor 1
                                              </th>
                                              <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">
                                                Setor 2
                                              </th>
                                              <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">
                                                Setor 3
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {/* Usar Set para garantir que cada stint seja único baseado no stint_number */}
                                            {Array.from(
                                              new Set(driverDetails.stints.map((stint) => stint.stint_number)),
                                            ).map((stintNumber) => {
                                              // Encontrar o stint correspondente ao número
                                              const stint = driverDetails.stints.find(
                                                (s) => s.stint_number === stintNumber,
                                              )

                                              if (!stint) return null

                                              // Encontrar a melhor volta deste stint
                                              const stintLaps = driverDetails.allLaps.filter(
                                                (lap) =>
                                                  lap.lap_number >= stint.lap_start &&
                                                  lap.lap_number <= stint.lap_end &&
                                                  lap.lap_duration !== null,
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
                                                <tr key={`stint-${stintNumber}`} className="border-b hover:bg-gray-50">
                                                  <td className="px-3 py-3 text-sm font-medium">
                                                    Stint {stint.stint_number}
                                                  </td>
                                                  <td className="px-3 py-3">
                                                    <span
                                                      className={`inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded-full ${
                                                        stint.compound === "SOFT"
                                                          ? "bg-red-100 text-red-800"
                                                          : stint.compound === "MEDIUM"
                                                            ? "bg-yellow-100 text-yellow-800"
                                                            : stint.compound === "HARD"
                                                              ? "bg-gray-100 text-gray-800"
                                                              : stint.compound === "INTERMEDIATE"
                                                                ? "bg-green-100 text-green-800"
                                                                : "bg-blue-100 text-blue-800"
                                                      }`}
                                                    >
                                                      {stint.compound}
                                                    </span>
                                                  </td>
                                                  <td className="px-3 py-3 text-sm">
                                                    Voltas {stint.lap_start} - {stint.lap_end}
                                                  </td>
                                                  <td className="px-3 py-3 text-sm">
                                                    {stint.lap_end - stint.lap_start + 1} voltas
                                                  </td>
                                                  <td className="px-3 py-3 font-mono text-sm text-green-600 font-medium">
                                                    {bestStintLap ? formatLapTime(bestStintLap.lap_duration || 0) : "-"}
                                                  </td>
                                                  <td className="px-3 py-3 font-mono text-sm">
                                                    {bestStintLap && bestStintLap.duration_sector_1
                                                      ? formatLapTime(bestStintLap.duration_sector_1)
                                                      : "-"}
                                                  </td>
                                                  <td className="px-3 py-3 font-mono text-sm">
                                                    {bestStintLap && bestStintLap.duration_sector_2
                                                      ? formatLapTime(bestStintLap.duration_sector_2)
                                                      : "-"}
                                                  </td>
                                                  <td className="px-3 py-3 font-mono text-sm">
                                                    {bestStintLap && bestStintLap.duration_sector_3
                                                      ? formatLapTime(bestStintLap.duration_sector_3)
                                                      : "-"}
                                                  </td>
                                                </tr>
                                              )
                                            })}
                                          </tbody>
                                        </table>
                                      </div>
                                    ) : (
                                      <div className="text-center py-4 text-muted-foreground">
                                        Nenhum dado de stint disponível para este piloto
                                      </div>
                                    )}
                                  </TabsContent>
                                </Tabs>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-4 text-muted-foreground">
                              Nenhum detalhe disponível para a melhor volta deste piloto
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
    </div>
  )
}
