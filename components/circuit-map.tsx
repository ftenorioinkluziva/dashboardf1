"use client"

import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface CircuitMapProps {
  circuitName: string
  circuitImage?: string
  country?: string
}

export function CircuitMap({ circuitName, circuitImage, country }: CircuitMapProps) {
  // Mapeamento de nomes de circuitos para arquivos de imagem
  const circuitImageMap: Record<string, string> = {
    Melbourne: "/images/circuits/melbourne.png",
    "Albert Park": "/images/circuits/melbourne.png",
    // Adicione mais circuitos conforme necessário
  }

  // Determinar qual imagem usar
  const imageUrl = circuitImage || circuitImageMap[circuitName] || "/placeholder.svg?height=300&width=500"

  return (
    <Card className="border rounded-md shadow-sm">
      <CardHeader className="bg-gray-50 border-b py-4 flex flex-row justify-between items-center">
        <CardTitle>Circuito: {circuitName}</CardTitle>
        {country && <span className="text-sm text-muted-foreground">{country}</span>}
      </CardHeader>
      <CardContent className="p-4">
        <div className="relative h-[300px] w-full rounded-md overflow-hidden">
          <Image
            src={imageUrl || "/placeholder.svg"}
            alt={`Circuito de ${circuitName}`}
            fill
            className="object-contain"
            priority
          />
        </div>
      </CardContent>
    </Card>
  )
}
