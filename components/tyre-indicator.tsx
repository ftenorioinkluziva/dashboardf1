interface TyreIndicatorProps {
  compound: string | null | undefined
  className?: string
}

export function TyreIndicator({ compound, className = "" }: TyreIndicatorProps) {
  if (!compound) return <span className="text-gray-400">-</span>

  // Normalizar o composto para maiúsculas e remover espaços
  const normalizedCompound = compound.toUpperCase().trim()

  // Definir cores e estilos com base no composto
  let bgColor = "bg-yellow-100"
  let textColor = "text-yellow-800"
  let displayText = "MEDIUM"

  switch (normalizedCompound) {
    case "SOFT":
    case "S":
      bgColor = "bg-red-100"
      textColor = "text-red-800"
      displayText = "SOFT"
      break
    case "MEDIUM":
    case "M":
      bgColor = "bg-yellow-100"
      textColor = "text-yellow-800"
      displayText = "MEDIUM"
      break
    case "HARD":
    case "H":
      bgColor = "bg-gray-100"
      textColor = "text-gray-800"
      displayText = "HARD"
      break
    default:
      // Se não reconhecermos o composto, usar o valor original
      displayText = normalizedCompound
  }

  return (
    <div className={`${bgColor} ${textColor} px-2 py-1 rounded text-center text-xs font-medium ${className}`}>
      {displayText}
    </div>
  )
}
