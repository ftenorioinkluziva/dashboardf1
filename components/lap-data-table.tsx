"use client"

import React, { useState } from "react"
import type { Lap } from "@/lib/types"
import { LapTimeDisplay } from "./lap-time-display"
import { TyreIndicator } from "./tyre-indicator"
import { LapSegmentVisualization } from "./lap-segment-visualization"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronDown, ChevronRight } from "lucide-react"

interface LapDataTableProps {
  laps: Lap[]
}

export function LapDataTable({ laps }: LapDataTableProps) {
  const [expandedLap, setExpandedLap] = useState<number | null>(null)

  if (!laps || laps.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dados de Voltas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">Nenhum dado de volta disponível</div>
        </CardContent>
      </Card>
    )
  }

  // Encontrar os melhores tempos para comparação
  const bestLapTime = Math.min(...laps.filter((lap) => lap.lap_duration !== null).map((lap) => lap.lap_duration!))
  const bestS1Time = Math.min(
    ...laps.filter((lap) => lap.duration_sector_1 !== null).map((lap) => lap.duration_sector_1!),
  )
  const bestS2Time = Math.min(
    ...laps.filter((lap) => lap.duration_sector_2 !== null).map((lap) => lap.duration_sector_2!),
  )
  const bestS3Time = Math.min(
    ...laps.filter((lap) => lap.duration_sector_3 !== null).map((lap) => lap.duration_sector_3!),
  )

  const toggleLapDetails = (lapNumber: number) => {
    if (expandedLap === lapNumber) {
      setExpandedLap(null)
    } else {
      setExpandedLap(lapNumber)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados de Voltas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead className="w-12 font-bold">Volta</TableHead>
                <TableHead className="w-16 font-bold">Pneu</TableHead>
                <TableHead className="font-bold">Tempo</TableHead>
                <TableHead className="font-bold">S1</TableHead>
                <TableHead className="font-bold">S2</TableHead>
                <TableHead className="font-bold">S3</TableHead>
                <TableHead className="text-right font-bold">Velocidades</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {laps.map((lap) => {
                const isPersonalBestLap = lap.lap_duration === bestLapTime && lap.lap_duration !== null
                const isPersonalBestS1 = lap.duration_sector_1 === bestS1Time && lap.duration_sector_1 !== null
                const isPersonalBestS2 = lap.duration_sector_2 === bestS2Time && lap.duration_sector_2 !== null
                const isPersonalBestS3 = lap.duration_sector_3 === bestS3Time && lap.duration_sector_3 !== null

                return (
                  <React.Fragment key={lap._key || `lap-${lap.lap_number}`}>
                    <TableRow
                      className={`cursor-pointer hover:bg-muted/50 ${
                        expandedLap === lap.lap_number ? "bg-muted/50" : ""
                      } border-b`}
                      onClick={() => toggleLapDetails(lap.lap_number)}
                    >
                      <TableCell className="font-medium flex items-center">
                        {expandedLap === lap.lap_number ? (
                          <ChevronDown className="h-4 w-4 mr-1" />
                        ) : (
                          <ChevronRight className="h-4 w-4 mr-1" />
                        )}
                        {lap.lap_number}
                      </TableCell>
                      <TableCell>
                        {lap.compound ? <TyreIndicator compound={lap.compound} age={lap.tyre_age || 0} /> : "-"}
                      </TableCell>
                      <TableCell>
                        <LapTimeDisplay
                          time={lap.lap_duration}
                          isPersonalBest={isPersonalBestLap}
                          isPitLap={lap.is_pit_out_lap}
                        />
                      </TableCell>
                      <TableCell>
                        <LapTimeDisplay time={lap.duration_sector_1} isPersonalBest={isPersonalBestS1} />
                      </TableCell>
                      <TableCell>
                        <LapTimeDisplay time={lap.duration_sector_2} isPersonalBest={isPersonalBestS2} />
                      </TableCell>
                      <TableCell>
                        <LapTimeDisplay time={lap.duration_sector_3} isPersonalBest={isPersonalBestS3} />
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-medium">
                        {lap.st_speed ? `${lap.st_speed} km/h` : "-"}
                      </TableCell>
                    </TableRow>
                    {expandedLap === lap.lap_number && (
                      <TableRow key={`${lap._key || `lap-${lap.lap_number}`}-details`} className="bg-muted/30">
                        <TableCell colSpan={7} className="p-4">
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-medium mb-2">Segmentos da Volta</h4>
                              <div className="space-y-2">
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium">Setor 1</span>
                                    <LapTimeDisplay time={lap.duration_sector_1} isPersonalBest={isPersonalBestS1} />
                                  </div>
                                  <LapSegmentVisualization segments={lap.segments_sector_1} sectorNumber={1} />
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium">Setor 2</span>
                                    <LapTimeDisplay time={lap.duration_sector_2} isPersonalBest={isPersonalBestS2} />
                                  </div>
                                  <LapSegmentVisualization segments={lap.segments_sector_2} sectorNumber={2} />
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium">Setor 3</span>
                                    <LapTimeDisplay time={lap.duration_sector_3} isPersonalBest={isPersonalBestS3} />
                                  </div>
                                  <LapSegmentVisualization segments={lap.segments_sector_3} sectorNumber={3} />
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <h4 className="text-sm font-medium mb-1">Velocidade I1</h4>
                                <p className="font-mono font-medium">{lap.i1_speed ? `${lap.i1_speed} km/h` : "-"}</p>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium mb-1">Velocidade I2</h4>
                                <p className="font-mono font-medium">{lap.i2_speed ? `${lap.i2_speed} km/h` : "-"}</p>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium mb-1">Velocidade ST</h4>
                                <p className="font-mono font-medium">{lap.st_speed ? `${lap.st_speed} km/h` : "-"}</p>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium mb-1">Informações Adicionais</h4>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xs font-medium">Saída de Box</p>
                                  <p className="font-medium">{lap.is_pit_out_lap ? "Sim" : "Não"}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium">Horário de Início</p>
                                  <p className="font-mono font-medium">
                                    {lap.date_start ? new Date(lap.date_start.$date).toLocaleTimeString() : "-"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
