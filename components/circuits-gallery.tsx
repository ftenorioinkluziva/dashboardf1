"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Circuit {
  id: string
  name: string
  country: string
  city: string
  imageUrl: string
  length: string
  turns: number
  lapRecord?: {
    time: string
    driver: string
    year: number
  }
}

// Dados de exemplo para circuitos
const circuits: Circuit[] = [
  {
    id: "melbourne",
    name: "Albert Park Circuit",
    country: "Austrália",
    city: "Melbourne",
    imageUrl: "/images/circuits/melbourne.png",
    length: "5.278 km",
    turns: 14,
    lapRecord: {
      time: "1:20.235",
      driver: "Charles Leclerc",
      year: 2022,
    },
  },
  // Adicione mais circuitos conforme necessário
]

export function CircuitsGallery() {
  const [selectedCircuit, setSelectedCircuit] = useState<Circuit | null>(circuits[0] || null)

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Circuitos da Temporada</h2>

      <Tabs
        defaultValue={circuits[0]?.id}
        onValueChange={(value) => {
          const circuit = circuits.find((c) => c.id === value)
          if (circuit) setSelectedCircuit(circuit)
        }}
      >
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
          {circuits.map((circuit) => (
            <TabsTrigger key={circuit.id} value={circuit.id}>
              {circuit.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {circuits.map((circuit) => (
          <TabsContent key={circuit.id} value={circuit.id}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{circuit.name}</span>
                  <span className="text-sm text-muted-foreground">{circuit.country}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative h-[300px] w-full rounded-md overflow-hidden">
                    <Image
                      src={circuit.imageUrl || "/placeholder.svg"}
                      alt={`Circuito de ${circuit.name}`}
                      fill
                      className="object-contain"
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium">Informações</h3>
                      <ul className="mt-2 space-y-2">
                        <li className="flex justify-between">
                          <span className="text-muted-foreground">País:</span>
                          <span>{circuit.country}</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-muted-foreground">Cidade:</span>
                          <span>{circuit.city}</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-muted-foreground">Comprimento:</span>
                          <span>{circuit.length}</span>
                        </li>
                        <li className="flex justify-between">
                          <span className="text-muted-foreground">Curvas:</span>
                          <span>{circuit.turns}</span>
                        </li>
                      </ul>
                    </div>

                    {circuit.lapRecord && (
                      <div>
                        <h3 className="text-lg font-medium">Recorde de Volta</h3>
                        <ul className="mt-2 space-y-2">
                          <li className="flex justify-between">
                            <span className="text-muted-foreground">Tempo:</span>
                            <span className="font-mono">{circuit.lapRecord.time}</span>
                          </li>
                          <li className="flex justify-between">
                            <span className="text-muted-foreground">Piloto:</span>
                            <span>{circuit.lapRecord.driver}</span>
                          </li>
                          <li className="flex justify-between">
                            <span className="text-muted-foreground">Ano:</span>
                            <span>{circuit.lapRecord.year}</span>
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
