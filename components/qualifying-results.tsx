"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import Image from "next/image"
import { fetchQualifyingResults } from "@/lib/client-data"
import type { QualifyingResult, DriverQualifyingResult } from "@/lib/types"
import { LapTimeDisplay } from "./lap-time-display"
import { TyreIndicator } from "./tyre-indicator"
import { AlertCircle, Clock, Flag } from "lucide-react"

interface QualifyingResultsProps {
  sessionId: string
}

export function QualifyingResults({ sessionId }: QualifyingResultsProps) {
  const [results, setResults] = useState<QualifyingResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("final-classification")

  useEffect(() => {
    async function loadResults() {
      try {
        setLoading(true)
        setError(null)
        // Remover este log

        const data = await fetchQualifyingResults(sessionId)

        if (!data || ((!data.stages || data.stages.length === 0) && (!data.finalGrid || data.finalGrid.length === 0))) {
          setError(
            "Não foi possível carregar os dados do qualifying. Verifique se esta sessão possui dados de qualifying.",
          )
        } else {
          setResults(data)
          // Set the first stage as active tab if available
          if (data.stages && data.stages.length > 0) {
            setActiveTab(data.stages[0].name)
          }
        }
      } catch (error) {
        // Capturar erro silenciosamente
        setError("Erro ao carregar resultados do qualifying")
      } finally {
        setLoading(false)
      }
    }

    loadResults()
  }, [sessionId])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-xl font-bold mb-4">Resultados do Qualifying</h2>
        <Skeleton className="h-8 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-xl font-bold mb-4">Resultados do Qualifying</h2>
        <div className="flex items-center justify-center py-8 text-amber-600">
          <AlertCircle className="h-5 w-5 mr-2" />
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (!results || !results.stages || results.stages.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-xl font-bold mb-4">Resultados do Qualifying</h2>
        <div className="text-center py-8 text-gray-500">Nenhum dado de qualifying disponível para esta sessão</div>
      </div>
    )
  }

  // Determinar se é Sprint Qualifying ou Qualifying regular
  const isSprintQualifying = results.stages[0]?.name.startsWith("SQ")
  const title = isSprintQualifying ? "Resultados do Sprint Qualifying" : "Resultados do Qualifying"

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
        <span>{title}</span>
      </h2>

      {/* Tabs */}
      <div className="border-b mb-4">
        <div className="flex overflow-x-auto">
          {results.stages.map((stage) => (
            <button
              key={stage.name}
              className={`px-4 py-2 flex items-center gap-1 ${
                activeTab === stage.name
                  ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab(stage.name)}
            >
              <Clock className="h-4 w-4" />
              <span>{stage.name}</span>
            </button>
          ))}
          <button
            className={`px-4 py-2 flex items-center gap-1 ${
              activeTab === "final-classification"
                ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("final-classification")}
          >
            <Flag className="h-4 w-4" />
            <span>Classificação Final</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {results.stages.map((stage) => (
        <div key={stage.name} className={activeTab === stage.name ? "block" : "hidden"}>
          <div className="mb-4">
            <h3 className="text-lg font-medium">
              {stage.name} - {formatTimeRange(stage.startTime, stage.endTime)}
            </h3>
            <p className="text-sm text-gray-500">
              {stage.name === "SQ1" && "Pneus médios obrigatórios - 5 pilotos eliminados"}
              {stage.name === "SQ2" && "Pneus médios obrigatórios - 5 pilotos eliminados"}
              {stage.name === "SQ3" && "Pneus macios obrigatórios - Definição do top 10"}
            </p>
          </div>
          <SimpleQualifyingTable
            drivers={stage.drivers}
            showCompound={true}
            highlightEliminated={stage.name !== "SQ3"}
          />
        </div>
      ))}

      {/* Final Classification Tab */}
      <div className={activeTab === "final-classification" ? "block" : "hidden"}>
        <div className="mb-4">
          <h3 className="text-lg font-medium">Classificação Final</h3>
          <p className="text-sm text-gray-500">
            Resultado final após todas as sessões de {isSprintQualifying ? "Sprint Qualifying" : "Qualifying"}
          </p>
        </div>
        {results.finalGrid && results.finalGrid.length > 0 ? (
          <SimpleFinalClassificationTable finalGrid={results.finalGrid} isSprintQualifying={isSprintQualifying} />
        ) : (
          <div className="text-center py-8 text-gray-500">Nenhum dado de classificação final disponível</div>
        )}
      </div>
    </div>
  )
}

interface SimpleQualifyingTableProps {
  drivers: DriverQualifyingResult[]
  showCompound?: boolean
  highlightEliminated?: boolean
}

function SimpleQualifyingTable({
  drivers,
  showCompound = false,
  highlightEliminated = false,
}: SimpleQualifyingTableProps) {
  if (!drivers || drivers.length === 0) {
    return <div className="text-center py-8 text-gray-500">Nenhum dado de piloto disponível para este estágio</div>
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-100">
            <TableHead className="w-16 text-center font-bold text-gray-700">Pos</TableHead>
            <TableHead className="font-bold text-gray-700">Piloto</TableHead>
            <TableHead className="font-bold text-gray-700">Equipe</TableHead>
            {showCompound && <TableHead className="font-bold text-gray-700">Pneu</TableHead>}
            <TableHead className="font-bold text-gray-700">S1</TableHead>
            <TableHead className="font-bold text-gray-700">S2</TableHead>
            <TableHead className="font-bold text-gray-700">S3</TableHead>
            <TableHead className="font-bold text-gray-700">Melhor Volta</TableHead>
            <TableHead className="font-bold text-gray-700">Diferença</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {drivers.map((driver, index) => {
            // Calcular a diferença para o líder
            const leaderTime = drivers[0].bestLapTime
            const gap = driver.bestLapTime && leaderTime ? driver.bestLapTime - leaderTime : null

            // Determinar a cor da linha com base na posição (par/ímpar)
            let rowColorClass = index % 2 === 0 ? "bg-gray-50" : "bg-white"

            // Se o piloto foi eliminado e devemos destacar isso
            if (highlightEliminated && driver.eliminated) {
              rowColorClass += " bg-red-50"
            }

            return (
              <TableRow key={`driver-${driver.driverNumber}-${index}`} className={`${rowColorClass} hover:bg-gray-100`}>
                <TableCell className="font-bold text-center">
                  {driver.position}
                  {highlightEliminated && driver.eliminated && (
                    <span className="text-red-500 ml-1" title="Piloto eliminado neste estágio">
                      ✗
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="relative h-8 w-8 rounded-full overflow-hidden flex-shrink-0 border border-gray-200">
                      <Image
                        src={driver.headshotUrl || "/placeholder.svg?height=32&width=32"}
                        alt={driver.fullName}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex items-center">
                      <div className="w-1 h-4 mr-2 rounded-full" style={{ backgroundColor: `#${driver.teamColor}` }} />
                      <span className="font-medium">{driver.fullName}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{driver.teamName}</TableCell>
                {showCompound && (
                  <TableCell>
                    {driver.compound ? (
                      <TyreIndicator compound={driver.compound} age={0} />
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                )}
                <TableCell>
                  {driver.sector1Time !== null ? (
                    <LapTimeDisplay time={driver.sector1Time} />
                  ) : (
                    <span className="text-gray-400 italic text-xs">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {driver.sector2Time !== null ? (
                    <LapTimeDisplay time={driver.sector2Time} />
                  ) : (
                    <span className="text-gray-400 italic text-xs">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {driver.sector3Time !== null ? (
                    <LapTimeDisplay time={driver.sector3Time} />
                  ) : (
                    <span className="text-gray-400 italic text-xs">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {driver.bestLapTime !== null ? (
                    <LapTimeDisplay time={driver.bestLapTime} isPersonalBest={index === 0} />
                  ) : (
                    <span className="text-gray-400 italic text-xs">-</span>
                  )}
                </TableCell>
                <TableCell className="font-mono">
                  {index === 0 ? (
                    <span className="font-bold">LÍDER</span>
                  ) : gap !== null ? (
                    <span className="text-gray-700">+{gap.toFixed(3)}</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

function SimpleFinalClassificationTable({
  finalGrid,
  isSprintQualifying,
}: {
  finalGrid: DriverQualifyingResult[]
  isSprintQualifying: boolean
}) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-100">
            <TableHead className="w-16 text-center font-bold text-gray-700">Pos</TableHead>
            <TableHead className="font-bold text-gray-700">Piloto</TableHead>
            <TableHead className="font-bold text-gray-700">Equipe</TableHead>
            <TableHead className="font-bold text-gray-700">Melhor Volta</TableHead>
            <TableHead className="font-bold text-gray-700">Diferença</TableHead>
            <TableHead className="font-bold text-gray-700">{isSprintQualifying ? "SQ1" : "Q1"}</TableHead>
            <TableHead className="font-bold text-gray-700">{isSprintQualifying ? "SQ2" : "Q2"}</TableHead>
            <TableHead className="font-bold text-gray-700">{isSprintQualifying ? "SQ3" : "Q3"}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {finalGrid.map((driver, index) => {
            // Calcular a diferença para o líder
            const leaderTime = finalGrid[0].bestLapTime
            const gap = driver.bestLapTime && leaderTime ? driver.bestLapTime - leaderTime : null

            // Determinar a cor da linha com base na posição e fase de eliminação
            let rowColorClass = index % 2 === 0 ? "bg-gray-50" : "bg-white"

            // Determinar em qual fase o piloto foi eliminado
            let eliminationPhase = null
            if (index >= 15) {
              // Eliminado no SQ1/Q1
              rowColorClass = "bg-red-50"
              eliminationPhase = "SQ1"
            } else if (index >= 10) {
              // Eliminado no SQ2/Q2
              rowColorClass = "bg-amber-50"
              eliminationPhase = "SQ2"
            }

            return (
              <TableRow key={`final-${driver.driverNumber}-${index}`} className={`${rowColorClass} hover:bg-gray-100`}>
                <TableCell className="font-bold text-center">
                  {driver.position}
                  {eliminationPhase && (
                    <span className="text-red-500 ml-1" title={`Eliminado no ${eliminationPhase}`}>
                      ✗
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="relative h-8 w-8 rounded-full overflow-hidden flex-shrink-0 border border-gray-200">
                      <Image
                        src={driver.headshotUrl || "/placeholder.svg?height=32&width=32"}
                        alt={driver.fullName}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex items-center">
                      <div className="w-1 h-4 mr-2 rounded-full" style={{ backgroundColor: `#${driver.teamColor}` }} />
                      <span className="font-medium">{driver.fullName}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{driver.teamName}</TableCell>
                <TableCell>
                  {driver.bestLapTime !== null ? (
                    <LapTimeDisplay time={driver.bestLapTime} isPersonalBest={index === 0} />
                  ) : (
                    <span className="text-gray-400 italic text-xs">-</span>
                  )}
                </TableCell>
                <TableCell className="font-mono">
                  {index === 0 ? (
                    <span className="font-bold">LÍDER</span>
                  ) : gap !== null ? (
                    <span className="text-gray-700">+{gap.toFixed(3)}</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {driver.q1Time !== null ? (
                    <LapTimeDisplay time={driver.q1Time} />
                  ) : (
                    <span className="text-gray-400 italic text-xs">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {driver.q2Time !== null ? (
                    <LapTimeDisplay time={driver.q2Time} />
                  ) : (
                    <span className="text-gray-400 italic text-xs">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {driver.q3Time !== null ? (
                    <LapTimeDisplay time={driver.q3Time} />
                  ) : (
                    <span className="text-gray-400 italic text-xs">-</span>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

function formatTimeRange(start: Date, end: Date): string {
  try {
    return `${new Date(start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${new Date(end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
  } catch (error) {
    return "Horário não disponível"
  }
}
