"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fetchSessionStandings } from "@/lib/client-data"
import { Skeleton } from "@/components/ui/skeleton"
import Image from "next/image"
import type { DriverStanding } from "@/lib/types"

interface SessionStandingsProps {
  sessionId: string
}

export function SessionStandings({ sessionId }: SessionStandingsProps) {
  const [standings, setStandings] = useState<DriverStanding[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStandings() {
      try {
        setLoading(true)
        const data = await fetchSessionStandings(sessionId)
        setStandings(data)
      } catch (error) {
        console.error("Erro ao carregar classificação:", error)
      } finally {
        setLoading(false)
      }
    }

    loadStandings()
  }, [sessionId])

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

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b">
        <h3 className="font-medium">Classificação da Sessão</h3>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead className="w-16 text-center font-bold text-gray-700">Pos</TableHead>
              <TableHead className="font-bold text-gray-700">Piloto</TableHead>
              <TableHead className="font-bold text-gray-700">Equipe</TableHead>
              <TableHead className="font-bold text-gray-700">Melhor Volta</TableHead>
              <TableHead className="font-bold text-gray-700">Diferença</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {standings.map((driver, index) => {
              // Calcular a diferença para o líder
              const gap = driver.bestLapTime - leaderTime
              const gapText = index === 0 ? "LÍDER" : `+${gap.toFixed(3)}`

              // Determinar a cor da linha com base na posição (par/ímpar)
              const rowColorClass = index % 2 === 0 ? "bg-gray-50" : "bg-white"

              // Usar uma combinação de driverNumber e index para garantir chaves únicas
              const uniqueKey = `driver-${driver.driverNumber}-${index}`

              // Formatar o tempo da volta para exibição
              const formattedLapTime = formatLapTime(driver.bestLapTime)

              return (
                <TableRow
                  key={uniqueKey}
                  className={`${rowColorClass} hover:bg-gray-100 cursor-pointer`}
                  onClick={() => (window.location.href = `/session/${sessionId}/driver/${driver.driverNumber}`)}
                >
                  <TableCell className="font-bold text-center">{index + 1}</TableCell>
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
                        <div
                          className="w-1 h-4 mr-2 rounded-full"
                          style={{ backgroundColor: `#${driver.teamColor}` }}
                        />
                        <span className="font-medium">{driver.fullName}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{driver.teamName}</TableCell>
                  <TableCell className="font-mono font-medium text-green-600">{formattedLapTime}</TableCell>
                  <TableCell className="font-mono font-medium">
                    {index === 0 ? (
                      <span className="font-bold">LÍDER</span>
                    ) : (
                      <span className="text-gray-700">+{gap.toFixed(3)}</span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// Função para formatar o tempo da volta no formato 1:17.251
function formatLapTime(timeInSeconds: number): string {
  const minutes = Math.floor(timeInSeconds / 60)
  const seconds = Math.floor(timeInSeconds % 60)
  const milliseconds = Math.floor((timeInSeconds % 1) * 1000)

  return `${minutes}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(3, "0").substring(0, 3)}`
}
