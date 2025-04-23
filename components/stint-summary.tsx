import type { Stint } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TyreIndicator } from "./tyre-indicator"

interface StintSummaryProps {
  stints: Stint[]
}

export function StintSummary({ stints }: StintSummaryProps) {
  if (!stints || stints.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resumo de Stints</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">Nenhum dado de stint disponível</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumo de Stints</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stints.map((stint) => (
            <div key={stint._key} className="flex items-center space-x-4 p-3 bg-muted rounded-md">
              <div className="flex-shrink-0">
                <TyreIndicator compound={stint.compound} age={stint.tyre_age_at_start} />
              </div>
              <div className="flex-grow">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium">Stint {stint.stint_number}</h4>
                  <span className="text-xs text-muted-foreground">
                    Voltas {stint.lap_start} - {stint.lap_end}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm">{stint.compound}</span>
                  <span className="text-xs text-muted-foreground">{stint.lap_end - stint.lap_start + 1} voltas</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
