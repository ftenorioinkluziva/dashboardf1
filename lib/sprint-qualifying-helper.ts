/**
 * Helper functions for processing Sprint Qualifying data
 */

import type { DriverQualifyingResult } from "./types"

/**
 * Processes lap data to extract sector times and other details
 * This is specifically designed to handle the Sprint Qualifying format
 */
export function processLapData(lap: any): {
  sector1: number | null
  sector2: number | null
  sector3: number | null
  totalTime: number | null
} {
  if (!lap) {
    return {
      sector1: null,
      sector2: null,
      sector3: null,
      totalTime: null,
    }
  }

  // Extract sector times
  const sector1 = lap.duration_sector_1
  const sector2 = lap.duration_sector_2
  const sector3 = lap.duration_sector_3

  // Debug the sector times
  // Remover este log

  // Calculate total time if all sectors are available
  let totalTime = lap.lap_duration

  // If lap_duration is not available but all sectors are, calculate it
  if (totalTime === null && sector1 !== null && sector2 !== null && sector3 !== null) {
    totalTime = sector1 + sector2 + sector3
  }

  return {
    sector1,
    sector2,
    sector3,
    totalTime,
  }
}

/**
 * Finds the best lap for a driver in a specific time range
 */
export function findBestLap(laps: any[], driverNumber: number, startTime: Date, endTime: Date) {
  // Filter laps by driver and time range
  const driverLaps = laps.filter(
    (lap: any) =>
      lap.driver_number === driverNumber &&
      new Date(lap.date_start.$date) >= startTime &&
      new Date(lap.date_start.$date) <= endTime &&
      lap.lap_duration !== null,
  )

  // Debug the number of laps found
  // Remover este log

  // Sort by lap time to find the best lap
  return driverLaps.sort(
    (a, b) => (a.lap_duration || Number.POSITIVE_INFINITY) - (b.lap_duration || Number.POSITIVE_INFINITY),
  )[0]
}

/**
 * Formats a lap time for display
 */
export function formatLapTime(time: number | null): string {
  if (time === null) return "-"

  // Format as minutes:seconds.milliseconds
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  const milliseconds = Math.floor((time % 1) * 1000)

  return `${minutes > 0 ? `${minutes}:` : ""}${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(3, "0").substring(0, 3)}`
}

/**
 * Determines the compound used for a lap based on stint data
 */
export function getLapCompound(lap: any, stints: any[]): string | null {
  if (!lap || !stints || stints.length === 0) return null

  // Find the stint that contains this lap
  const stint = stints.find((s) => lap.lap_number >= s.lap_start && lap.lap_number <= s.lap_end)

  return stint ? stint.compound : null
}

/**
 * Creates a driver result object with all necessary data
 */
export function createDriverResult(
  driver: any,
  bestLap: any,
  compound: string | null,
  position: number,
  eliminated = false,
): DriverQualifyingResult {
  const lapData = processLapData(bestLap)

  return {
    driverNumber: driver.driver_number,
    fullName: driver.full_name,
    nameAcronym: driver.name_acronym,
    teamName: driver.team_name,
    teamColor: driver.team_colour,
    headshotUrl: driver.headshot_url,
    bestLapTime: lapData.totalTime,
    bestLapNumber: bestLap ? bestLap.lap_number : null,
    position,
    eliminated,
    compound,
    sector1Time: lapData.sector1,
    sector2Time: lapData.sector2,
    sector3Time: lapData.sector3,
    bestLapDetails: bestLap
      ? {
          sector1: lapData.sector1,
          sector2: lapData.sector2,
          sector3: lapData.sector3,
          lapNumber: bestLap.lap_number,
          compound,
        }
      : null,
  }
}
