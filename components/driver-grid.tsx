"use client"

import { useState, useEffect } from "react"
import { fetchSessionStandings } from "@/lib/client-data"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import Image from "next/image"
import Link from "next/link"
import { Trophy, Clock } from "lucide-react"
import { LapTimeDisplay } from "./lap-time-display"
import type { DriverStanding } from "@/lib/types"

interface DriverGridProps {
  sessionId: string
}

export function DriverGrid({ sessionId }: DriverGridProps) {
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, index) => (
          <Card key={index} className="overflow-hidden">
            <div className="h-2 bg-gray-200" />
            <CardContent className="p-4">
              <Skeleton className="h-24 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (standings.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">Nenhum piloto encontrado para esta sessão</div>
  }

  // Função para formatar a posição com sufixo ordinal
  const formatPosition = (pos: number): string => {
    if (pos === 1) return "1º"
    if (pos === 2) return "2º"
    if (pos === 3) return "3º"
    return `${pos}º`
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {standings.map((driver, index) => (
        <Link
          key={driver.driverNumber}
          href={`/session/${sessionId}/driver/${driver.driverNumber}`}
          className="block transition-transform hover:scale-105"
        >
          <Card className="overflow-hidden h-full">
            <div className="h-2" style={{ backgroundColor: `#${driver.teamColor}` }} />
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="relative h-24 w-24 mb-2 mx-auto">
                    <Image
                      src={driver.headshotUrl || "/placeholder.svg?height=100&width=100&query=driver"}
                      alt={driver.fullName}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h3 className="font-bold text-center">{driver.fullName}</h3>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <div className="w-1 h-4 rounded-sm" style={{ backgroundColor: `#${driver.teamColor}` }}></div>
                    <p className="text-xs text-muted-foreground">{driver.teamName}</p>
                  </div>
                  <div className="relative w-full h-8 mt-2 hidden md:block">
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

              <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <div className="flex items-center">
                  <Trophy className="h-4 w-4 mr-1 text-yellow-500" />
                  <span className="font-bold">{formatPosition(index + 1)}</span>
                </div>

                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-green-500" />
                  <span className="font-mono text-sm">
                    <LapTimeDisplay time={driver.bestLapTime} isPersonalBest={true} />
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
