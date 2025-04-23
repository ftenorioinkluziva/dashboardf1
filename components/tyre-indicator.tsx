interface TyreIndicatorProps {
  compound: string
  age: number
}

export function TyreIndicator({ compound, age }: TyreIndicatorProps) {
  let bgColor = "bg-gray-400"
  let textColor = "text-white"
  let borderColor = "border-gray-500"

  switch (compound?.toUpperCase()) {
    case "SOFT":
      bgColor = "bg-red-500"
      borderColor = "border-red-700"
      break
    case "MEDIUM":
      bgColor = "bg-yellow-400"
      textColor = "text-black font-bold"
      borderColor = "border-yellow-600"
      break
    case "HARD":
      bgColor = "bg-white"
      textColor = "text-black font-bold"
      borderColor = "border-gray-400"
      break
    case "INTERMEDIATE":
      bgColor = "bg-green-500"
      borderColor = "border-green-700"
      break
    case "WET":
      bgColor = "bg-blue-500"
      borderColor = "border-blue-700"
      break
  }

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full ${bgColor} ${textColor} w-6 h-6 text-xs font-bold border ${borderColor}`}
      title={`${compound} (${age} voltas)`}
    >
      {compound?.charAt(0)}
    </div>
  )
}
