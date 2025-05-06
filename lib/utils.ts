import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string | Date): string {
  try {
    const date = new Date(dateString)

    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      return "Data não disponível"
    }

    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    })
  } catch (error) {
    console.error("Erro ao formatar data:", error)
    return "Data não disponível"
  }
}

// Helper function to format lap time (1:28.123)
export function formatLapTime(timeInSeconds: number | undefined | null): string {
  if (timeInSeconds === undefined || timeInSeconds === null) return "-"

  const minutes = Math.floor(timeInSeconds / 60)
  const seconds = Math.floor(timeInSeconds % 60)
  const milliseconds = Math.floor((timeInSeconds % 1) * 1000)

  return `${minutes > 0 ? `${minutes}:` : ""}${seconds.toString().padStart(minutes > 0 ? 2 : 1, "0")}.${milliseconds
    .toString()
    .padStart(3, "0")
    .substring(0, 3)}`
}
