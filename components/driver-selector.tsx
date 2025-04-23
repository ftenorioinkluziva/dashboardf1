"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { fetchDrivers } from "@/lib/client-data"
import type { Driver } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface DriverSelectorProps {
  sessionId: string
  selectedDriverNumber?: string
}

export function DriverSelector({ sessionId, selectedDriverNumber }: DriverSelectorProps) {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function loadDrivers() {
      try {
        setLoading(true)
        const data = await fetchDrivers(sessionId)
        setDrivers(data)
      } catch (error) {
        console.error("Erro ao carregar pilotos:", error)
      } finally {
        setLoading(false)
      }
    }

    loadDrivers()
  }, [sessionId])

  const handleDriverSelect = (driverNumber: number) => {
    router.push(`/session/${sessionId}/driver/${driverNumber}`)
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, index) => (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4">
                <Skeleton className="h-24 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (drivers.length === 0) {
    return (
      <div className="bg-muted p-4 rounded-md text-center">
        <p className="text-muted-foreground">Nenhum piloto encontrado para esta sessão</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {drivers.map((driver) => {
        const isSelected = selectedDriverNumber === driver.driver_number.toString()
        const teamColor = `#${driver.team_colour}`

        return (
          <Card
            key={driver._key}
            className={`overflow-hidden cursor-pointer transition-all hover:shadow-md ${
              isSelected ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => handleDriverSelect(driver.driver_number)}
          >
            <CardContent className="p-0">
              <div
                className="h-2"
                style={{
                  backgroundColor: teamColor,
                }}
              />
              <div className="p-4">
                <div className="relative h-24 w-full mb-2">
                  <Image
                    src={driver.headshot_url || "/placeholder.svg?height=100&width=100"}
                    alt={driver.full_name}
                    fill
                    className="object-contain"
                  />
                </div>
                <h3 className="font-bold text-sm">{driver.broadcast_name}</h3>
                <p className="text-xs text-muted-foreground">{driver.team_name}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
