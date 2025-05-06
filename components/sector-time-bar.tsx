"use client"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SectorTimeBarProps {
  sector1: number | null
  sector2: number | null
  sector3: number | null
  bestSector1: number | null
  bestSector2: number | null
  bestSector3: number | null
  showLabels?: boolean
}

export function SectorTimeBar({
  sector1,
  sector2,
  sector3,
  bestSector1,
  bestSector2,
  bestSector3,
  showLabels = true,
}: SectorTimeBarProps) {
  // Verificar se temos todos os dados necessários
  if (!sector1 || !sector2 || !sector3) {
    return <div className="text-xs text-muted-foreground">Dados de setores incompletos</div>
  }

  // Calcular o tempo total da volta
  const totalTime = sector1 + sector2 + sector3

  // Calcular a porcentagem de cada setor
  const sector1Percent = (sector1 / totalTime) * 100
  const sector2Percent = (sector2 / totalTime) * 100
  const sector3Percent = (sector3 / totalTime) * 100

  // Determinar as cores dos setores
  const sector1Color = sector1 === bestSector1 ? "bg-purple-600" : "bg-violet-300"
  const sector2Color = sector2 === bestSector2 ? "bg-purple-600" : "bg-emerald-300"
  const sector3Color = sector3 === bestSector3 ? "bg-purple-600" : "bg-amber-300"

  // Calcular as diferenças para os melhores setores
  const diff1 = bestSector1 ? (sector1 - bestSector1).toFixed(3) : "N/A"
  const diff2 = bestSector2 ? (sector2 - bestSector2).toFixed(3) : "N/A"
  const diff3 = bestSector3 ? (sector3 - bestSector3).toFixed(3) : "N/A"

  return (
    <div className="space-y-1">
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`${sector1Color} transition-all`} style={{ width: `${sector1Percent}%` }} />
            </TooltipTrigger>
            <TooltipContent side="top">
              <div className="text-xs">
                <div>Setor 1: {sector1.toFixed(3)}s</div>
                {bestSector1 && <div>{sector1 === bestSector1 ? "Melhor setor" : `+${diff1}s`}</div>}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`${sector2Color} transition-all`} style={{ width: `${sector2Percent}%` }} />
            </TooltipTrigger>
            <TooltipContent side="top">
              <div className="text-xs">
                <div>Setor 2: {sector2.toFixed(3)}s</div>
                {bestSector2 && <div>{sector2 === bestSector2 ? "Melhor setor" : `+${diff2}s`}</div>}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`${sector3Color} transition-all`} style={{ width: `${sector3Percent}%` }} />
            </TooltipTrigger>
            <TooltipContent side="top">
              <div className="text-xs">
                <div>Setor 3: {sector3.toFixed(3)}s</div>
                {bestSector3 && <div>{sector3 === bestSector3 ? "Melhor setor" : `+${diff3}s`}</div>}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {showLabels && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <div className="flex items-center">
            <div className={`h-2 w-2 rounded-full ${sector1Color} mr-1`} />
            <span>S1: {sector1.toFixed(3)}s</span>
            {bestSector1 && sector1 !== bestSector1 && <span className="ml-1 text-gray-500">+{diff1}s</span>}
          </div>
          <div className="flex items-center">
            <div className={`h-2 w-2 rounded-full ${sector2Color} mr-1`} />
            <span>S2: {sector2.toFixed(3)}s</span>
            {bestSector2 && sector2 !== bestSector2 && <span className="ml-1 text-gray-500">+{diff2}s</span>}
          </div>
          <div className="flex items-center">
            <div className={`h-2 w-2 rounded-full ${sector3Color} mr-1`} />
            <span>S3: {sector3.toFixed(3)}s</span>
            {bestSector3 && sector3 !== bestSector3 && <span className="ml-1 text-gray-500">+{diff3}s</span>}
          </div>
        </div>
      )}
    </div>
  )
}
