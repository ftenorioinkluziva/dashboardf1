import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function TyreLegend() {
  const tyres = [
    { name: "Macio", compound: "SOFT", color: "bg-red-600", image: "/images/icons/soft.png" },
    { name: "Médio", compound: "MEDIUM", color: "bg-yellow-500", image: "/images/icons/medium.png" },
    { name: "Duro", compound: "HARD", color: "bg-white border border-gray-300", image: "/images/icons/hard.png" },
  ]

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Legenda de Pneus</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4">
          {tyres.map((tyre) => (
            <div key={tyre.compound} className="flex items-center gap-2">
              <div className="relative w-6 h-6">
                <Image
                  src={tyre.image || "/placeholder.svg"}
                  alt={tyre.name}
                  width={24}
                  height={24}
                  className="object-contain"
                />
              </div>
              <span className="text-sm">{tyre.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
