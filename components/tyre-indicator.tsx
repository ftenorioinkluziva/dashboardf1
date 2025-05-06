interface TyreIndicatorProps {
  compound: string
  size?: "xs" | "sm" | "md"
}

export function TyreIndicator({ compound, size = "md" }: TyreIndicatorProps) {
  let bgColor = "bg-gray-200"
  let textColor = "text-gray-700"
  let displayText = "UNK"

  switch (compound?.toUpperCase()) {
    case "SOFT":
      bgColor = "bg-red-100"
      textColor = "text-red-700"
      displayText = "SOFT"
      break
    case "MEDIUM":
      bgColor = "bg-yellow-100"
      textColor = "text-yellow-800"
      displayText = "MEDIUM"
      break
    case "HARD":
      bgColor = "bg-white"
      textColor = "text-gray-800"
      displayText = "HARD"
      break
    case "INTERMEDIATE":
      bgColor = "bg-green-100"
      textColor = "text-green-700"
      displayText = "INT"
      break
    case "WET":
      bgColor = "bg-blue-100"
      textColor = "text-blue-700"
      displayText = "WET"
      break
    default:
      bgColor = "bg-gray-200"
      textColor = "text-gray-700"
      displayText = "UNK"
  }

  const sizeClasses = {
    xs: "text-[10px] px-1 py-0.5",
    sm: "text-xs px-1.5 py-0.5",
    md: "text-xs px-2 py-1",
  }

  return (
    <span className={`inline-block ${bgColor} ${textColor} font-medium rounded ${sizeClasses[size]}`}>
      {displayText}
    </span>
  )
}
