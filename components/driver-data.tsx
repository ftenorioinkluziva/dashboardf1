"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { fetchDriverData } from "@/lib/client-data"
import type { Driver, Lap, Stint, Position } from "@/lib/types"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { LapDataTable } from "./lap-data-table"
import { StintSummary } from "./stint-summary"
import { Trophy, Clock } from "lucide-react"
import { LapTimeDisplay } from "./lap-time-display"

interface DriverDataProps {
  sessionId: string
  driverNumber: string
}

export function DriverData({ sessionId, driverNumber }: DriverDataProps) {
  const [driverData, setDriverData] = useState<{
    driver: Driver | null
    laps: Lap[]
    stints: Stint[]
    position: Position | null
    bestLapInfo: {
      bestLapTime: number | null
      bestLapNumber: number | null
    }
  }>({
    driver: null,
    laps: [],
    stints: [],
    position: null,
    bestLapInfo: { bestLapTime: null, bestLapNumber: null },
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDriverData() {
      try {
        setLoading(true)
        const data = await fetchDriverData(sessionId, driverNumber)
        setDriverData(data)
      } catch (error) {
        console.error("Erro ao carregar dados do piloto:", error)
      } finally {
        setLoading(false)
      }
    }

    loadDriverData()
  }, [sessionId, driverNumber])

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <Skeleton className="h-40 w-40" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  const { driver, laps, stints, position, bestLapInfo } = driverData

  if (!driver) {
    return (
      <div className="bg-muted p-4 rounded-md text-center">
        <p className="text-muted-foreground">Piloto não encontrado</p>
      </div>
    )
  }

  const teamColor = `#${driver.team_colour}`

  // Função para formatar a posição com sufixo ordinal
  const formatPosition = (pos: number): string => {
    if (pos === 1) return "1º"
    if (pos === 2) return "2º"
    if (pos === 3) return "3º"
    return `${pos}º`
  }

  return (
    <div className="space-y-6">
      <Card>
        <div
          className="h-2"
          style={{
            backgroundColor: teamColor,
          }}
        />
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="relative h-40 w-40 mx-auto md:mx-0">
              <Image
                src={driver.headshot_url || "/placeholder.svg?height=150&width=150"}
                alt={driver.full_name}
                fill
                className="object-contain"
              />
            </div>
            <div className="flex-grow">
              <h2 className="text-2xl font-bold">{driver.full_name}</h2>
              <p className="text-lg text-muted-foreground mb-2">{driver.team_name}</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Número</p>
                  <p className="font-medium">{driver.driver_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sigla</p>
                  <p className="font-medium">{driver.name_acronym}</p>
                </div>
              </div>
            </div>

            {/* Informações de posição e melhor volta */}
            <div className="md:border-l md:pl-6 mt-4 md:mt-0 flex flex-col justify-center">
              {position && (
                <div className="flex items-center mb-3">
                  <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium">Posição na Sessão</p>
                    <p className="text-xl font-bold">{formatPosition(position.position)}</p>
                  </div>
                </div>
              )}

              {bestLapInfo.bestLapTime && (
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Melhor Volta (Volta {bestLapInfo.bestLapNumber})</p>
                    <p className="text-xl font-mono">
                      <LapTimeDisplay time={bestLapInfo.bestLapTime} isPersonalBest={true} />
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="lap-data">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="lap-data">Dados de Voltas</TabsTrigger>
          <TabsTrigger value="stint-summary">Resumo de Stints</TabsTrigger>
        </TabsList>
        <TabsContent value="lap-data">
          <LapDataTable laps={laps} />
        </TabsContent>
        <TabsContent value="stint-summary">
          <StintSummary stints={stints} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
