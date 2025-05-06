"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { DriverStanding } from "@/lib/types"

interface DriverComparisonProps {
  drivers: DriverStanding[]
  onClose: () => void
}

export function DriverComparison({ drivers, onClose }: DriverComparisonProps) {
  // Ensure we have exactly 2 drivers to compare
  if (drivers.length !== 2) {
    return null
  }

  const [driver1, driver2] = drivers

  // Find the best lap for each driver
  const bestLap1 = driver1.bestLapDetails
  const bestLap2 = driver2.bestLapDetails

  // Calculate deltas between drivers
  const sector1Delta = bestLap2.sector1 - bestLap1.sector1
  const sector2Delta = bestLap2.sector2 - bestLap1.sector2
  const sector3Delta = bestLap2.sector3 - bestLap1.sector3
  const totalDelta = driver2.bestLapTime - driver1.bestLapTime

  // Determine which driver has the best sector times
  const bestSector1Driver = sector1Delta > 0 ? 1 : 2
  const bestSector2Driver = sector2Delta > 0 ? 1 : 2
  const bestSector3Driver = sector3Delta > 0 ? 1 : 2

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-bold">Comparação de Pilotos</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          Detalhes da Volta {bestLap1.lapNumber} <span className="text-green-600">(Melhor Volta)</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-[1fr_3fr] gap-4">
          {/* Header row */}
          <div className="font-medium text-sm">Piloto</div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center font-medium text-sm">Setor 1</div>
            <div className="text-center font-medium text-sm">Setor 2</div>
            <div className="text-center font-medium text-sm">Setor 3</div>
          </div>

          {/* Driver 1 row */}
          <div className="flex items-center gap-2">
            <div className="relative h-10 w-10 rounded-full overflow-hidden flex-shrink-0 border border-gray-200">
              <Image
                src={driver1.headshotUrl || "/placeholder.svg?height=40&width=40"}
                alt={driver1.fullName}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <div className="font-medium">{driver1.fullName}</div>
              <div className="text-sm text-muted-foreground flex items-center">
                <div className="w-2 h-2 mr-1 rounded-full" style={{ backgroundColor: `#${driver1.teamColor}` }} />
                {driver1.teamName}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Sector 1 */}
            <div className="flex flex-col items-center">
              <div className="font-mono font-medium">{formatSectorTime(bestLap1.sector1)}</div>
              {bestSector1Driver === 1 && <div className="text-xs text-purple-600 font-medium">MELHOR SETOR</div>}
              <div className="text-xs text-muted-foreground">Velocidade I1</div>
              <div className="text-xs font-mono">{driver1.i1Speed || "---"} km/h</div>
            </div>

            {/* Sector 2 */}
            <div className="flex flex-col items-center">
              <div className="font-mono font-medium">{formatSectorTime(bestLap1.sector2)}</div>
              {bestSector2Driver === 1 && <div className="text-xs text-purple-600 font-medium">MELHOR SETOR</div>}
              <div className="text-xs text-muted-foreground">Velocidade I2</div>
              <div className="text-xs font-mono">{driver1.i2Speed || "---"} km/h</div>
            </div>

            {/* Sector 3 */}
            <div className="flex flex-col items-center">
              <div className="font-mono font-medium">{formatSectorTime(bestLap1.sector3)}</div>
              {bestSector3Driver === 1 && <div className="text-xs text-purple-600 font-medium">MELHOR SETOR</div>}
              <div className="text-xs text-muted-foreground">Velocidade ST</div>
              <div className="text-xs font-mono">{driver1.stSpeed || "---"} km/h</div>
            </div>
          </div>

          {/* Total time and position for driver 1 */}
          <div className="col-span-2 flex justify-end items-center gap-4 py-2">
            <div className="text-right">
              <div className="text-sm font-medium">Tempo Total:</div>
              <div className="font-mono text-green-600 font-medium">{formatLapTime(driver1.bestLapTime)}</div>
            </div>
            <div className="bg-gray-100 px-3 py-1 rounded-md">
              <div className="font-bold text-lg">{driver1.position}º</div>
            </div>
          </div>

          {/* Driver 2 row */}
          <div className="flex items-center gap-2">
            <div className="relative h-10 w-10 rounded-full overflow-hidden flex-shrink-0 border border-gray-200">
              <Image
                src={driver2.headshotUrl || "/placeholder.svg?height=40&width=40"}
                alt={driver2.fullName}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <div className="font-medium">{driver2.fullName}</div>
              <div className="text-sm text-muted-foreground flex items-center">
                <div className="w-2 h-2 mr-1 rounded-full" style={{ backgroundColor: `#${driver2.teamColor}` }} />
                {driver2.teamName}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Sector 1 */}
            <div className="flex flex-col items-center">
              <div className="font-mono font-medium">{formatSectorTime(bestLap2.sector1)}</div>
              {bestSector1Driver === 2 && <div className="text-xs text-purple-600 font-medium">MELHOR SETOR</div>}
              <div className="text-xs text-gray-500">
                {sector1Delta !== 0 && (
                  <span className={sector1Delta > 0 ? "text-red-500" : "text-green-500"}>
                    {sector1Delta > 0 ? "+" : ""}
                    {sector1Delta.toFixed(3)}s
                  </span>
                )}
              </div>
              <div className="text-xs font-mono">{driver2.i1Speed || "---"} km/h</div>
            </div>

            {/* Sector 2 */}
            <div className="flex flex-col items-center">
              <div className="font-mono font-medium">{formatSectorTime(bestLap2.sector2)}</div>
              {bestSector2Driver === 2 && <div className="text-xs text-purple-600 font-medium">MELHOR SETOR</div>}
              <div className="text-xs text-gray-500">
                {sector2Delta !== 0 && (
                  <span className={sector2Delta > 0 ? "text-red-500" : "text-green-500"}>
                    {sector2Delta > 0 ? "+" : ""}
                    {sector2Delta.toFixed(3)}s
                  </span>
                )}
              </div>
              <div className="text-xs font-mono">{driver2.i2Speed || "---"} km/h</div>
            </div>

            {/* Sector 3 */}
            <div className="flex flex-col items-center">
              <div className="font-mono font-medium">{formatSectorTime(bestLap2.sector3)}</div>
              {bestSector3Driver === 2 && <div className="text-xs text-purple-600 font-medium">MELHOR SETOR</div>}
              <div className="text-xs text-gray-500">
                {sector3Delta !== 0 && (
                  <span className={sector3Delta > 0 ? "text-red-500" : "text-green-500"}>
                    {sector3Delta > 0 ? "+" : ""}
                    {sector3Delta.toFixed(3)}s
                  </span>
                )}
              </div>
              <div className="text-xs font-mono">{driver2.stSpeed || "---"} km/h</div>
            </div>
          </div>

          {/* Total time and position for driver 2 */}
          <div className="col-span-2 flex justify-end items-center gap-4 py-2">
            <div className="text-right">
              <div className="text-sm font-medium">Tempo Total:</div>
              <div className="font-mono text-green-600 font-medium">{formatLapTime(driver2.bestLapTime)}</div>
            </div>
            <div className="bg-gray-100 px-3 py-1 rounded-md">
              <div className="font-bold text-lg">{driver2.position}º</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Helper function to format sector time (28.123)
function formatSectorTime(timeInSeconds: number): string {
  if (!timeInSeconds) return "-"
  return timeInSeconds.toFixed(3)
}

// Helper function to format lap time (1:28.123)
function formatLapTime(timeInSeconds: number): string {
  if (!timeInSeconds) return "-"

  const minutes = Math.floor(timeInSeconds / 60)
  const seconds = Math.floor(timeInSeconds % 60)
  const milliseconds = Math.floor((timeInSeconds % 1) * 1000)

  return `${minutes > 0 ? `${minutes}:` : ""}${seconds.toString().padStart(minutes > 0 ? 2 : 1, "0")}.${milliseconds.toString().padStart(3, "0").substring(0, 3)}`
}
