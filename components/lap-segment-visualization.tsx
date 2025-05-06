import { segmentColorMap } from "@/lib/client-data"

interface LapSegmentVisualizationProps {
  segments: number[]
  sectorNumber: number
}

export function LapSegmentVisualization({ segments, sectorNumber }: LapSegmentVisualizationProps) {
  if (!segments || segments.length === 0) {
    return (
      <div className="flex items-center justify-center h-5 bg-gray-200 rounded">
        <span className="text-xs text-gray-500 font-medium">Sem dados</span>
      </div>
    )
  }

  return (
    <div className="flex h-5 w-full rounded overflow-hidden border border-gray-300">
      {segments.map((segment, index) => {
        const colorInfo = segmentColorMap[segment] || segmentColorMap[0]
        // Usar uma combinação de sectorNumber, index e segment para garantir chaves únicas
        const uniqueKey = `sector-${sectorNumber}-segment-${index}-${segment}`

        return (
          <div
            key={uniqueKey}
            className="h-full border-r last:border-r-0 border-gray-300/50"
            style={{
              backgroundColor: colorInfo.cssColor,
              width: `${100 / segments.length}%`,
            }}
            title={`Setor ${sectorNumber}, Segmento ${index + 1}: ${colorInfo.color}`}
          />
        )
      })}
    </div>
  )
}
