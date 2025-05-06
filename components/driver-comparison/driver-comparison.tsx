"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { DriverStanding } from "@/lib/types"
import { fetchDriverData } from "@/lib/client-data"
import { useEffect, useState } from "react"
import { TyreIndicator } from "@/components/tyre-indicator"

interface DriverComparisonProps {
  drivers: DriverStanding[]
  onClose: () => void
  sessionId?: string
}

export function DriverComparison({ drivers, onClose, sessionId }: DriverComparisonProps) {
  const [driversData, setDriversData] = useState<Record<number, any>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDriverData() {
      if (!sessionId) return

      setLoading(true)
      try {
        // Create an object to store all driver data
        const newDriversData: Record<number, any> = {}

        // Fetch data for all drivers in parallel
        const promises = drivers.map((driver) =>
          fetchDriverData(sessionId, driver.driverNumber.toString()).then((data) => {
            newDriversData[driver.driverNumber] = data
          }),
        )

        await Promise.all(promises)
        setDriversData(newDriversData)
      } catch (error) {
        console.error("Error loading driver data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadDriverData()
  }, [drivers, sessionId])

  // Find the best lap for each driver
  const driverBestLaps = drivers.map((driver) => {
    const driverData = driversData[driver.driverNumber]
    if (!driverData) return null

    return driverData.laps?.find((lap: any) => lap.lap_number === driverData.bestLapInfo?.bestLapNumber)
  })

  // Find the best sector times across all drivers
  const bestSector1 = Math.min(
    ...driverBestLaps
      .filter((lap) => lap && lap.duration_sector_1 !== null)
      .map((lap) => lap?.duration_sector_1 || Number.POSITIVE_INFINITY),
  )

  const bestSector2 = Math.min(
    ...driverBestLaps
      .filter((lap) => lap && lap.duration_sector_2 !== null)
      .map((lap) => lap?.duration_sector_2 || Number.POSITIVE_INFINITY),
  )

  const bestSector3 = Math.min(
    ...driverBestLaps
      .filter((lap) => lap && lap.duration_sector_3 !== null)
      .map((lap) => lap?.duration_sector_3 || Number.POSITIVE_INFINITY),
  )

  // Sort drivers by position
  const sortedDrivers = [...drivers].sort((a, b) => a.position - b.position)

  if (loading) {
    return (
      <Card className="bg-white shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-bold">Comparação de Pilotos</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-8">
            <div className="text-muted-foreground">Carregando dados de comparação...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="pb-2 pt-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-bold">Comparação de Pilotos</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          Detalhes da <span className="text-green-600">(Melhor Volta)</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-4 mb-2">
          <div className="font-medium text-sm">Piloto</div>
          <div className="text-center font-medium text-sm">Setor 1</div>
          <div className="text-center font-medium text-sm">Setor 2</div>
          <div className="text-center font-medium text-sm">Setor 3</div>
        </div>

        {sortedDrivers.map((driver, index) => {
          const driverData = driversData[driver.driverNumber]
          const bestLap = driverBestLaps[drivers.findIndex((d) => d.driverNumber === driver.driverNumber)]

          // Reference driver (first in the list) for delta calculations
          const referenceDriver = sortedDrivers[0]
          const referenceLap = driverBestLaps[drivers.findIndex((d) => d.driverNumber === referenceDriver.driverNumber)]

          // Calculate deltas (only for non-reference drivers)
          const sector1Delta =
            index > 0 && bestLap?.duration_sector_1 && referenceLap?.duration_sector_1
              ? bestLap.duration_sector_1 - referenceLap.duration_sector_1
              : null

          const sector2Delta =
            index > 0 && bestLap?.duration_sector_2 && referenceLap?.duration_sector_2
              ? bestLap.duration_sector_2 - referenceLap.duration_sector_2
              : null

          const sector3Delta =
            index > 0 && bestLap?.duration_sector_3 && referenceLap?.duration_sector_3
              ? bestLap.duration_sector_3 - referenceLap.duration_sector_3
              : null

          // Check if this driver has the best sector times
          const hasBestSector1 = bestLap?.duration_sector_1 === bestSector1
          const hasBestSector2 = bestLap?.duration_sector_2 === bestSector2
          const hasBestSector3 = bestLap?.duration_sector_3 === bestSector3

          return (
            <div key={driver.driverNumber} className="grid grid-cols-[1fr_1fr_1fr_1fr] gap-4 py-3 border-t">
              {/* Driver info and total time */}
              <div className="flex items-center gap-2">
                <div className="relative h-10 w-10 rounded-full overflow-hidden flex-shrink-0 border border-gray-200">
                  <Image
                    src={driver.headshotUrl || "/placeholder.svg?height=40&width=40"}
                    alt={driver.fullName}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate flex items-center gap-1">
                    {driver.fullName}
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: `#${driver.teamColor}` }} />
                  </div>
                  <div className="text-sm text-muted-foreground truncate">{driver.teamName}</div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1">
                      <div className="font-mono text-green-600 text-sm">{formatLapTime(driver.bestLapTime)}</div>
                      {bestLap?.compound && <TyreIndicator compound={bestLap.compound} className="h-4 w-4" />}
                    </div>
                    <div className="bg-gray-100 px-2 py-0.5 rounded-md">
                      <div className="font-bold text-sm">{driver.position}º</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sector 1 */}
              <div className="flex flex-col items-center justify-center">
                <div className={`font-mono font-medium py-1 px-2 rounded ${hasBestSector1 ? "bg-purple-100" : ""}`}>
                  {formatSectorTime(bestLap?.duration_sector_1)}
                </div>
                {sector1Delta !== null && (
                  <div className="text-xs text-red-500 mt-1">
                    {sector1Delta > 0 ? `+${sector1Delta.toFixed(3)}s` : ""}
                  </div>
                )}
                <div className="text-xs font-mono mt-1">
                  Velocidade I1 {bestLap?.i1_speed ? `${bestLap.i1_speed} km/h` : ""}
                </div>
              </div>

              {/* Sector 2 */}
              <div className="flex flex-col items-center justify-center">
                <div className={`font-mono font-medium py-1 px-2 rounded ${hasBestSector2 ? "bg-purple-100" : ""}`}>
                  {formatSectorTime(bestLap?.duration_sector_2)}
                </div>
                {sector2Delta !== null && (
                  <div className="text-xs text-red-500 mt-1">
                    {sector2Delta > 0 ? `+${sector2Delta.toFixed(3)}s` : ""}
                  </div>
                )}
                <div className="text-xs font-mono mt-1">
                  Velocidade I2 {bestLap?.i2_speed ? `${bestLap.i2_speed} km/h` : ""}
                </div>
              </div>

              {/* Sector 3 */}
              <div className="flex flex-col items-center justify-center">
                <div className={`font-mono font-medium py-1 px-2 rounded ${hasBestSector3 ? "bg-purple-100" : ""}`}>
                  {formatSectorTime(bestLap?.duration_sector_3)}
                </div>
                {sector3Delta !== null && (
                  <div className="text-xs text-red-500 mt-1">
                    {sector3Delta > 0 ? `+${sector3Delta.toFixed(3)}s` : ""}
                  </div>
                )}
                <div className="text-xs font-mono mt-1">
                  Velocidade ST {bestLap?.st_speed ? `${bestLap.st_speed} km/h` : ""}
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

// Helper function to format sector time (28.123)
function formatSectorTime(timeInSeconds: number | undefined | null): string {
  if (timeInSeconds === undefined || timeInSeconds === null) return "-"
  return timeInSeconds.toFixed(3)
}

// Helper function to format lap time (1:28.123)
function formatLapTime(timeInSeconds: number | undefined | null): string {
  if (timeInSeconds === undefined || timeInSeconds === null) return "-"

  const minutes = Math.floor(timeInSeconds / 60)
  const seconds = Math.floor(timeInSeconds % 60)
  const milliseconds = Math.floor((timeInSeconds % 1) * 1000)

  return `${minutes > 0 ? `${minutes}:` : ""}${seconds.toString().padStart(minutes > 0 ? 2 : 1, "0")}.${milliseconds.toString().padStart(3, "0").substring(0, 3)}`
}
