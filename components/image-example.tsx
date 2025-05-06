"use client"

import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ImageExample() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Exemplo de Uso de Imagens</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Imagem de Piloto</h3>
            <div className="relative h-40 w-40 mx-auto">
              <Image
                src="/images/drivers/placeholder-driver.jpg"
                alt="Piloto"
                fill
                className="object-cover rounded-md"
              />
            </div>
            <p className="text-sm text-center mt-2 text-muted-foreground">
              Imagem de um piloto usando o componente Image do Next.js
            </p>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Logo de Equipe</h3>
            <div className="relative h-20 w-40 mx-auto">
              <Image src="/images/teams/placeholder-team.png" alt="Equipe" fill className="object-contain" />
            </div>
            <p className="text-sm text-center mt-2 text-muted-foreground">
              Logo de uma equipe usando o componente Image do Next.js
            </p>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Circuito</h3>
            <div className="relative h-40 w-full mx-auto">
              <Image
                src="/images/circuits/placeholder-circuit.jpg"
                alt="Circuito"
                fill
                className="object-cover rounded-md"
              />
            </div>
            <p className="text-sm text-center mt-2 text-muted-foreground">
              Imagem de um circuito usando o componente Image do Next.js
            </p>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Imagem de Fundo</h3>
            <div
              className="h-40 w-full rounded-md bg-center bg-cover"
              style={{ backgroundImage: "url('/images/backgrounds/placeholder-bg.jpg')" }}
            ></div>
            <p className="text-sm text-center mt-2 text-muted-foreground">
              Imagem de fundo usando CSS background-image
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
