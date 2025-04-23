interface LapTimeDisplayProps {
  time: number | null
  isPersonalBest?: boolean
  isSessionBest?: boolean
  isPitLap?: boolean
}

export function LapTimeDisplay({ time, isPersonalBest, isSessionBest, isPitLap }: LapTimeDisplayProps) {
  if (time === null || time === undefined) {
    return <span className="text-gray-400">-</span>
  }

  // Formatar o tempo (segundos para minutos:segundos.milissegundos)
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  const milliseconds = Math.floor((time % 1) * 1000)

  const formattedTime = `${minutes > 0 ? `${minutes}:` : ""}${seconds.toString().padStart(minutes > 0 ? 2 : 1, "0")}.${milliseconds.toString().padStart(3, "0").substring(0, 3)}`

  let textColorClass = "text-foreground font-medium"
  if (isPitLap) {
    textColorClass = "text-orange-600 dark:text-orange-400 font-medium"
  } else if (isSessionBest) {
    textColorClass = "text-purple-700 dark:text-purple-400 font-bold"
  } else if (isPersonalBest) {
    textColorClass = "text-green-700 dark:text-green-400 font-bold"
  }

  return <span className={`font-mono ${textColorClass}`}>{formattedTime}</span>
}
