"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatLapTime } from "@/lib/utils"
import type { QualifyingResult } from "@/lib/types"
import Image from "next/image"
import { TyreIndicator } from "./tyre-indicator"

interface QualifyingResultsProps {
  sessionId: string
}

// Função auxiliar para determinar o composto para cada sessão
function getSessionCompound(driver: any, session: "q1" | "q2" | "q3"): string | null {
  // Usar os compostos específicos por sessão
  if (session === "q1" && driver.q1Compound) return driver.q1Compound
  if (session === "q2" && driver.q2Compound) return driver.q2Compound
  if (session === "q3" && driver.q3Compound) return driver.q3Compound

  // Caso contrário, usar o composto geral (fallback)
  return driver.compound || "MEDIUM"
}

export function QualifyingResults({ sessionId }: QualifyingResultsProps) {
  const [results, setResults] = useState<QualifyingResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchQualifyingResults() {
      try {
        setLoading(true)
        const response = await fetch(`/api/sessions/${sessionId}/qualifying`)

        if (!response.ok) {
          throw new Error(`Erro ao buscar resultados: ${response.status}`)
        }

        const data = await response.json()
        setResults(data)
      } catch (err) {
        console.error("Erro ao buscar resultados da classificação:", err)
        setError("Não foi possível carregar os resultados da classificação.")
      } finally {
        setLoading(false)
      }
    }

    fetchQualifyingResults()
  }, [sessionId])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resultados da Classificação</CardTitle>
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
          <CardTitle>Resultados da Classificação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-500">{error}</div>
        </CardContent>
      </Card>
    )
  }

  if (!results || !results.finalGrid || results.finalGrid.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resultados da Classificação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500">Nenhum resultado disponível para esta sessão.</div>
        </CardContent>
      </Card>
    )
  }

  // Verificar se temos resultados para Q1, Q2 e Q3
  const hasQ1 = results?.finalGrid?.some((r) => r.q1Time !== null && r.q1Time !== undefined)
  const hasQ2 = results?.finalGrid?.some((r) => r.q2Time !== null && r.q2Time !== undefined)
  const hasQ3 = results?.finalGrid?.some((r) => r.q3Time !== null && r.q3Time !== undefined)

  // Determinar qual aba mostrar por padrão
  let defaultTab = "combined"
  if (hasQ3) defaultTab = "q3"
  else if (hasQ2) defaultTab = "q2"
  else if (hasQ1) defaultTab = "q1"

  // Componente para renderizar o tempo com o indicador de pneu
  const LapTimeWithTyre = ({
    time,
    compound,
  }: {
    time: number | null | undefined
    compound: string | null | undefined
  }) => {
    if (!time) return <span className="text-gray-400">-</span>

    return (
      <div className="flex items-center justify-end gap-2">
        <span className="font-mono">{formatLapTime(time)}</span>
        {compound && <TyreIndicator compound={compound} className="w-16" />}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resultados da Classificação</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={defaultTab}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="combined">Combinado</TabsTrigger>
            <TabsTrigger value="q1" disabled={!hasQ1}>
              Q1
            </TabsTrigger>
            <TabsTrigger value="q2" disabled={!hasQ2}>
              Q2
            </TabsTrigger>
            <TabsTrigger value="q3" disabled={!hasQ3}>
              Q3
            </TabsTrigger>
          </TabsList>

          <TabsContent value="combined">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-16 text-center font-medium">Pos</TableHead>
                    <TableHead className="font-medium">Piloto</TableHead>
                    <TableHead className="font-medium">Equipe</TableHead>
                    <TableHead className="text-right font-medium">Q1</TableHead>
                    <TableHead className="text-right font-medium">Q2</TableHead>
                    <TableHead className="text-right font-medium">Q3</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.finalGrid.map((driver) => (
                    <TableRow key={driver.driverNumber} className="hover:bg-gray-50">
                      <TableCell className="font-medium text-center">{driver.position}</TableCell>
                      <TableCell>
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
                      <TableCell>
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
                      <TableCell className="text-right">
                        <LapTimeWithTyre time={driver.q1Time} compound={driver.q1Compound} />
                      </TableCell>
                      <TableCell className="text-right">
                        <LapTimeWithTyre time={driver.q2Time} compound={driver.q2Compound} />
                      </TableCell>
                      <TableCell className="text-right">
                        <LapTimeWithTyre time={driver.q3Time} compound={driver.q3Compound} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Conteúdo para Q1 */}
          <TabsContent value="q1">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-16 text-center font-medium">Pos</TableHead>
                    <TableHead className="font-medium">Piloto</TableHead>
                    <TableHead className="font-medium">Equipe</TableHead>
                    <TableHead className="font-medium">Pneu</TableHead>
                    <TableHead className="text-right font-medium">Tempo</TableHead>
                    <TableHead className="text-right font-medium">Delta</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...results.finalGrid]
                    .filter((driver) => driver.q1Time !== null && driver.q1Time !== undefined)
                    .sort((a, b) => (a.q1Time || Number.POSITIVE_INFINITY) - (b.q1Time || Number.POSITIVE_INFINITY))
                    .map((driver, index) => {
                      const bestTime = results.finalGrid.reduce(
                        (min, d) => (d.q1Time !== null && d.q1Time !== undefined && d.q1Time < min ? d.q1Time : min),
                        Number.POSITIVE_INFINITY,
                      )
                      const delta =
                        driver.q1Time !== null && driver.q1Time !== undefined ? driver.q1Time - bestTime : null

                      return (
                        <TableRow key={`q1-${driver.driverNumber}`} className="hover:bg-gray-50">
                          <TableCell className="font-medium text-center">{index + 1}</TableCell>
                          <TableCell>
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
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-1 h-6 rounded-sm"
                                style={{ backgroundColor: `#${driver.teamColor}` }}
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
                          <TableCell>
                            <TyreIndicator compound={driver.q1Compound} />
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {driver.q1Time ? formatLapTime(driver.q1Time) : "-"}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {index === 0 ? (
                              <span className="font-bold">LÍDER</span>
                            ) : delta !== null ? (
                              <span className="text-gray-700">+{delta.toFixed(3)}</span>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Conteúdo para Q2 */}
          <TabsContent value="q2">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-16 text-center font-medium">Pos</TableHead>
                    <TableHead className="font-medium">Piloto</TableHead>
                    <TableHead className="font-medium">Equipe</TableHead>
                    <TableHead className="font-medium">Pneu</TableHead>
                    <TableHead className="text-right font-medium">Tempo</TableHead>
                    <TableHead className="text-right font-medium">Delta</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...results.finalGrid]
                    .filter((driver) => driver.q2Time !== null && driver.q2Time !== undefined)
                    .sort((a, b) => (a.q2Time || Number.POSITIVE_INFINITY) - (b.q2Time || Number.POSITIVE_INFINITY))
                    .map((driver, index) => {
                      const bestTime = results.finalGrid.reduce(
                        (min, d) => (d.q2Time !== null && d.q2Time !== undefined && d.q2Time < min ? d.q2Time : min),
                        Number.POSITIVE_INFINITY,
                      )
                      const delta =
                        driver.q2Time !== null && driver.q2Time !== undefined ? driver.q2Time - bestTime : null

                      return (
                        <TableRow key={`q2-${driver.driverNumber}`} className="hover:bg-gray-50">
                          <TableCell className="font-medium text-center">{index + 1}</TableCell>
                          <TableCell>
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
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-1 h-6 rounded-sm"
                                style={{ backgroundColor: `#${driver.teamColor}` }}
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
                          <TableCell>
                            <TyreIndicator compound={driver.q2Compound} />
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {driver.q2Time ? formatLapTime(driver.q2Time) : "-"}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {index === 0 ? (
                              <span className="font-bold">LÍDER</span>
                            ) : delta !== null ? (
                              <span className="text-gray-700">+{delta.toFixed(3)}</span>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Conteúdo para Q3 */}
          <TabsContent value="q3">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-16 text-center font-medium">Pos</TableHead>
                    <TableHead className="font-medium">Piloto</TableHead>
                    <TableHead className="font-medium">Equipe</TableHead>
                    <TableHead className="font-medium">Pneu</TableHead>
                    <TableHead className="text-right font-medium">Tempo</TableHead>
                    <TableHead className="text-right font-medium">Delta</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...results.finalGrid]
                    .filter((driver) => driver.q3Time !== null && driver.q3Time !== undefined)
                    .sort((a, b) => (a.q3Time || Number.POSITIVE_INFINITY) - (b.q3Time || Number.POSITIVE_INFINITY))
                    .map((driver, index) => {
                      const bestTime = results.finalGrid.reduce(
                        (min, d) => (d.q3Time !== null && d.q3Time !== undefined && d.q3Time < min ? d.q3Time : min),
                        Number.POSITIVE_INFINITY,
                      )
                      const delta =
                        driver.q3Time !== null && driver.q3Time !== undefined ? driver.q3Time - bestTime : null

                      return (
                        <TableRow key={`q3-${driver.driverNumber}`} className="hover:bg-gray-50">
                          <TableCell className="font-medium text-center">{index + 1}</TableCell>
                          <TableCell>
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
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-1 h-6 rounded-sm"
                                style={{ backgroundColor: `#${driver.teamColor}` }}
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
                          <TableCell>
                            <TyreIndicator compound={driver.q3Compound} />
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {driver.q3Time ? formatLapTime(driver.q3Time) : "-"}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {index === 0 ? (
                              <span className="font-bold">LÍDER</span>
                            ) : delta !== null ? (
                              <span className="text-gray-700">+{delta.toFixed(3)}</span>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
