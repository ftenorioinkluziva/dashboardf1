"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { LapTimeDisplay } from "./lap-time-display"
import { TyreIndicator } from "./tyre-indicator"
import type { Lap } from "@/lib/types"

interface LapDataTableProps {
  laps: Lap[]
}

export function LapDataTable({ laps }: LapDataTableProps) {
  const [selectedLap, setSelectedLap] = useState<Lap | null>(null)

  // Encontrar a melhor volta
  const bestLap = laps.reduce(
    (best, current) => {
      if (current.lap_time && (!best.lap_time || current.lap_time < best.lap_time)) {
        return current
      }
      return best
    },
    { lap_time: null } as Partial<Lap>,
  ) as Lap | null

  // Ordenar voltas por número
  const sortedLaps = [...laps].sort((a, b) => a.lap_number - b.lap_number)

  // Formatar delta de tempo
  const formatDelta = (delta: number | null): string => {
    if (delta === null) return ""
    const sign = delta >= 0 ? "+" : "-"
    return `${sign}${Math.abs(delta).toFixed(3)}s`
  }

  // Calcular deltas de setor em relação à melhor volta
  const calculateSectorDeltas = (lap: Lap) => {
    if (!bestLap) return { sector1Delta: null, sector2Delta: null, sector3Delta: null }

    const sector1Delta = lap.sector1_time && bestLap.sector1_time ? lap.sector1_time - bestLap.sector1_time : null

    const sector2Delta = lap.sector2_time && bestLap.sector2_time ? lap.sector2_time - bestLap.sector2_time : null

    const sector3Delta = lap.sector3_time && bestLap.sector3_time ? lap.sector3_time - bestLap.sector3_time : null

    return { sector1Delta, sector2Delta, sector3Delta }
  }

  // Verificar se é o melhor setor
  const isBestSector = (lap: Lap, sectorNum: 1 | 2 | 3): boolean => {
    const sectorKey = `sector${sectorNum}_time` as keyof Lap
    const lapSectorTime = lap[sectorKey] as number | null

    if (!lapSectorTime) return false

    return laps.every((otherLap) => {
      const otherSectorTime = otherLap[sectorKey] as number | null
      return !otherSectorTime || lapSectorTime <= otherSectorTime
    })
  }

  return (
    <Tabs defaultValue="laps">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="laps">Voltas da Sessão</TabsTrigger>
        <TabsTrigger value="sectors">Setores</TabsTrigger>
      </TabsList>

      <TabsContent value="laps" className="border rounded-md">
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Volta</TableHead>
                <TableHead className="w-[100px]">Pneu</TableHead>
                <TableHead className="text-right">Tempo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedLaps.map((lap) => (
                <TableRow
                  key={lap.lap_number}
                  className={`cursor-pointer ${selectedLap?.lap_number === lap.lap_number ? "bg-muted" : ""}`}
                  onClick={() => setSelectedLap(lap)}
                >
                  <TableCell>Volta {lap.lap_number}</TableCell>
                  <TableCell>
                    <TyreIndicator compound={lap.tyre_compound} />
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {lap.lap_time ? (
                      <LapTimeDisplay time={lap.lap_time} isPersonalBest={bestLap?.lap_number === lap.lap_number} />
                    ) : (
                      <span className="text-muted-foreground">Sem tempo</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="sectors">
        {selectedLap ? (
          <div className="p-4 border rounded-md">
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-medium">
                Detalhes da Volta {selectedLap.lap_number}
                {bestLap?.lap_number === selectedLap.lap_number && (
                  <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                    Melhor Volta
                  </Badge>
                )}
              </h3>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Tempo Total:</div>
                <div className="font-mono text-lg">
                  <LapTimeDisplay
                    time={selectedLap.lap_time || 0}
                    isPersonalBest={bestLap?.lap_number === selectedLap.lap_number}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {[1, 2, 3].map((sector) => {
                const sectorKey = `sector${sector}_time` as keyof Lap
                const sectorTime = selectedLap[sectorKey] as number | null
                const { sector1Delta, sector2Delta, sector3Delta } = calculateSectorDeltas(selectedLap)
                const deltaValue = sector === 1 ? sector1Delta : sector === 2 ? sector2Delta : sector3Delta
                const isBest = isBestSector(selectedLap, sector as 1 | 2 | 3)
                const speedKey = `speed_i${sector === 3 ? "st" : sector}` as keyof Lap
                const speed = selectedLap[speedKey] as number | null

                return (
                  <div key={sector} className="p-4 border rounded-md">
                    <div className="text-sm font-medium mb-1">Setor {sector}</div>
                    <div className="flex justify-between items-center">
                      <div className="font-mono text-xl">{sectorTime ? sectorTime.toFixed(3) : "-"}</div>
                      {deltaValue !== null && (
                        <div
                          className={`text-sm font-mono ${deltaValue > 0 ? "text-red-500" : deltaValue < 0 ? "text-green-500" : "text-gray-500"}`}
                        >
                          {formatDelta(deltaValue)}
                        </div>
                      )}
                    </div>
                    {isBest && <div className="text-purple-500 text-xs font-medium mt-1">MELHOR SETOR</div>}
                    <div className="mt-2 text-sm text-muted-foreground flex justify-between">
                      <span>Velocidade {sector === 3 ? "ST" : "I" + sector}</span>
                      <span>{speed ? `${speed} km/h` : "-"}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Remover a barra de visualização de setores */}
            {/* <SectorTimeBar sectors={[
              { time: selectedLap.sector1_time, delta: sector1Delta },
              { time: selectedLap.sector2_time, delta: sector2Delta },
              { time: selectedLap.sector3_time, delta: sector3Delta }
            ]} /> */}
          </div>
        ) : (
          <div className="p-6 text-center text-muted-foreground border rounded-md">
            Selecione uma volta na aba "Voltas da Sessão" para ver os detalhes dos setores.
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
