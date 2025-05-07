"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatLapTime } from "@/lib/utils"
import type { RaceResult } from "@/lib/types"
import Image from "next/image"

interface RaceResultsProps {
  sessionId: string
  sessionType: string // Pode ser "Race" ou "Sprint"
}

export function RaceResults({ sessionId, sessionType }: RaceResultsProps) {
  const [results, setResults] = useState<RaceResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRaceResults() {
      try {
        setLoading(true)
        console.log(`Buscando resultados para a sessão ${sessionId}`)
        const response = await fetch(`/api/sessions/${sessionId}/standings`)

        if (!response.ok) {
          console.error(`Erro na resposta: ${response.status} ${response.statusText}`)
          throw new Error(`Erro ao buscar resultados: ${response.status}`)
        }

        const data = await response.json()
        console.log("Dados recebidos:", data)
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resultados da {sessionType === "Sprint" ? "Sprint" : "Corrida"}</CardTitle>
        </CardHeader>
        <CardContent>
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
        <CardHeader>
          <CardTitle>Resultados da {sessionType === "Sprint" ? "Sprint" : "Corrida"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-500">{error}</div>
        </CardContent>
      </Card>
    )
  }

  if (results.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resultados da {sessionType === "Sprint" ? "Sprint" : "Corrida"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500">Nenhum resultado disponível para esta sessão.</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resultados da {sessionType === "Sprint" ? "Sprint" : "Corrida"}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-16 text-center font-medium">Pos</TableHead>
                <TableHead className="font-medium">Piloto</TableHead>
                <TableHead className="font-medium">Equipe</TableHead>
                <TableHead className="text-right font-medium">Melhor Volta</TableHead>
                <TableHead className="text-right hidden lg:table-cell font-medium">Setor 1</TableHead>
                <TableHead className="text-right hidden lg:table-cell font-medium">Setor 2</TableHead>
                <TableHead className="text-right hidden lg:table-cell font-medium">Setor 3</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((driver) => (
                <TableRow key={driver.driverNumber} className="hover:bg-gray-50">
                  <TableCell className="font-medium text-center">{driver.position}</TableCell>
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
                              // Fallback para imagem padrão se a imagem da equipe não existir
                              const target = e.target as HTMLImageElement
                              target.src = "/images/teams/placeholder-team.png"
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {driver.bestLapTime ? formatLapTime(driver.bestLapTime) : "-"}
                  </TableCell>
                  <TableCell
                    className={`text-right font-mono hidden lg:table-cell ${
                      driver.sector1Time && driver.sector1Time === bestSector1 ? "bg-purple-100" : ""
                    }`}
                  >
                    {driver.sector1Time ? formatLapTime(driver.sector1Time) : "-"}
                  </TableCell>
                  <TableCell
                    className={`text-right font-mono hidden lg:table-cell ${
                      driver.sector2Time && driver.sector2Time === bestSector2 ? "bg-purple-100" : ""
                    }`}
                  >
                    {driver.sector2Time ? formatLapTime(driver.sector2Time) : "-"}
                  </TableCell>
                  <TableCell
                    className={`text-right font-mono hidden lg:table-cell ${
                      driver.sector3Time && driver.sector3Time === bestSector3 ? "bg-purple-100" : ""
                    }`}
                  >
                    {driver.sector3Time ? formatLapTime(driver.sector3Time) : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
