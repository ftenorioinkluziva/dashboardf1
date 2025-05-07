"use server"

import type { QualifyingResult, QualifyingStage, DriverQualifyingResult, RaceResult } from "./types"
import { connectToDatabase } from "./mongodb"

// Funções existentes que estamos usando
export async function getMeetings() {
  try {
    const { db } = await connectToDatabase()
    const meetings = await db.collection("meetings").find({}).sort({ date_start: -1 }).toArray()
    return JSON.parse(JSON.stringify(meetings))
  } catch (error) {
    console.error("Error fetching meetings:", error)
    return []
  }
}

export async function getSessionById(sessionId: string) {
  try {
    const { db } = await connectToDatabase()
    const session = await db.collection("sessions").findOne({ session_key: Number.parseInt(sessionId) })
    return session ? JSON.parse(JSON.stringify(session)) : null
  } catch (error) {
    console.error("Error fetching session:", error)
    return null
  }
}

export async function getSessionsByMeetingKey(meetingKey: string) {
  try {
    const { db } = await connectToDatabase()
    const sessions = await db
      .collection("sessions")
      .find({ meeting_key: Number.parseInt(meetingKey) })
      .sort({ date_start: 1 })
      .toArray()
    return JSON.parse(JSON.stringify(sessions))
  } catch (error) {
    console.error("Error fetching sessions:", error)
    return []
  }
}

export async function getSessionsByTypeAndMeeting(sessionType: string, meetingKey: string) {
  try {
    const { db } = await connectToDatabase()
    const sessions = await db
      .collection("sessions")
      .find({
        meeting_key: Number.parseInt(meetingKey),
        session_type: sessionType,
      })
      .sort({ date_start: 1 })
      .toArray()
    return JSON.parse(JSON.stringify(sessions))
  } catch (error) {
    console.error("Error fetching sessions by type:", error)
    return []
  }
}

export async function getDriversBySessionKey(sessionKey: string) {
  try {
    const { db } = await connectToDatabase()
    const drivers = await db
      .collection("drivers")
      .find({ session_key: Number.parseInt(sessionKey) })
      .sort({ driver_number: 1 })
      .toArray()
    return JSON.parse(JSON.stringify(drivers))
  } catch (error) {
    console.error("Error fetching drivers:", error)
    return []
  }
}

export async function getDriverById(sessionKey: string, driverNumber: string) {
  try {
    const { db } = await connectToDatabase()
    const driver = await db.collection("drivers").findOne({
      session_key: Number.parseInt(sessionKey),
      driver_number: Number.parseInt(driverNumber),
    })
    return driver ? JSON.parse(JSON.stringify(driver)) : null
  } catch (error) {
    console.error("Error fetching driver:", error)
    return null
  }
}

export async function getLapsBySessionAndDriver(sessionKey: string, driverNumber: string) {
  try {
    const { db } = await connectToDatabase()

    // Buscar as voltas do piloto
    const laps = await db
      .collection("laps")
      .find({
        session_key: Number.parseInt(sessionKey),
        driver_number: Number.parseInt(driverNumber),
      })
      .sort({ lap_number: 1 })
      .toArray()

    // Buscar os stints do piloto para adicionar informações de pneus
    const stints = await db
      .collection("stints")
      .find({
        session_key: Number.parseInt(sessionKey),
        driver_number: Number.parseInt(driverNumber),
      })
      .sort({ stint_number: 1 })
      .toArray()

    // Adicionar informações de pneus às voltas
    const lapsWithTyreInfo = laps.map((lap: any) => {
      // Encontrar o stint correspondente a esta volta
      const stint = stints.find((s: any) => lap.lap_number >= s.lap_start && lap.lap_number <= s.lap_end)

      if (stint) {
        return {
          ...lap,
          compound: stint.compound,
          tyre_age: stint.tyre_age_at_start + (lap.lap_number - stint.lap_start),
        }
      }

      return lap
    })

    return JSON.parse(JSON.stringify(lapsWithTyreInfo))
  } catch (error) {
    console.error("Error fetching laps:", error)
    return []
  }
}

export async function getStintsBySessionAndDriver(sessionKey: string, driverNumber: string) {
  try {
    const { db } = await connectToDatabase()
    const stints = await db
      .collection("stints")
      .find({
        session_key: Number.parseInt(sessionKey),
        driver_number: Number.parseInt(driverNumber),
      })
      .sort({ stint_number: 1 })
      .toArray()
    return JSON.parse(JSON.stringify(stints))
  } catch (error) {
    console.error("Error fetching stints:", error)
    return []
  }
}

export async function getDriverPosition(sessionKey: string, driverNumber: string) {
  try {
    const { db } = await connectToDatabase()
    const position = await db.collection("position").findOne({
      session_key: Number.parseInt(sessionKey),
      driver_number: Number.parseInt(driverNumber),
    })
    return position ? JSON.parse(JSON.stringify(position)) : null
  } catch (error) {
    console.error("Error fetching driver position:", error)
    return null
  }
}

export async function getBestLapInfo(sessionKey: string, driverNumber: string) {
  try {
    const { db } = await connectToDatabase()
    const laps = await db
      .collection("laps")
      .find({
        session_key: Number.parseInt(sessionKey),
        driver_number: Number.parseInt(driverNumber),
        lap_duration: { $ne: null },
      })
      .sort({ lap_duration: 1 })
      .limit(1)
      .toArray()

    if (laps.length > 0) {
      return {
        bestLapTime: laps[0].lap_duration,
        bestLapNumber: laps[0].lap_number,
      }
    }

    return {
      bestLapTime: null,
      bestLapNumber: null,
    }
  } catch (error) {
    console.error("Error fetching best lap info:", error)
    return {
      bestLapTime: null,
      bestLapNumber: null,
    }
  }
}

export async function getSessionStandings(sessionId: string) {
  try {
    const { db } = await connectToDatabase()

    // Buscar a sessão para determinar o tipo
    const session = await getSessionById(sessionId)

    // Se for uma corrida (RACE) ou sprint, usar a classificação de corrida
    if (session && (session.session_type === "Race" || session.session_name.includes("Sprint"))) {
      return await getRaceResults(sessionId)
    }

    // Para outros tipos de sessão (treinos, classificação), usar a classificação por tempo de volta
    // Buscar todos os pilotos da sessão
    const drivers = await getDriversBySessionKey(sessionId)

    // Para cada piloto, buscar sua melhor volta e posição
    const standings = await Promise.all(
      drivers.map(async (driver: any) => {
        const bestLapInfo = await getBestLapInfo(sessionId, driver.driver_number.toString())

        // Buscar a melhor volta para obter mais detalhes
        let bestLapSpeed = null
        let sector1Time = null
        let sector2Time = null
        let sector3Time = null

        if (bestLapInfo.bestLapNumber) {
          const bestLap = await db.collection("laps").findOne({
            session_key: Number.parseInt(sessionId),
            driver_number: driver.driver_number,
            lap_number: bestLapInfo.bestLapNumber,
          })

          if (bestLap) {
            bestLapSpeed = bestLap.st_speed || null
            sector1Time = bestLap.duration_sector_1 || null
            sector2Time = bestLap.duration_sector_2 || null
            sector3Time = bestLap.duration_sector_3 || null
          }
        }

        return {
          driverNumber: driver.driver_number,
          fullName: driver.full_name,
          nameAcronym: driver.name_acronym,
          teamName: driver.team_name,
          teamColor: driver.team_colour,
          headshotUrl: driver.headshot_url,
          bestLapTime: bestLapInfo.bestLapTime || Number.POSITIVE_INFINITY,
          bestLapNumber: bestLapInfo.bestLapNumber,
          bestLapSpeed: bestLapSpeed,
          sector1Time: sector1Time,
          sector2Time: sector2Time,
          sector3Time: sector3Time,
          position: 0, // Será definido após a ordenação
        }
      }),
    )

    // Filtrar pilotos sem tempo de volta
    const validStandings = standings.filter((driver) => driver.bestLapTime !== Number.POSITIVE_INFINITY)

    // Remover duplicatas baseadas no número do piloto
    const uniqueDrivers = new Map()
    validStandings.forEach((driver) => {
      // Se este piloto ainda não foi adicionado ou tem um tempo melhor que o registrado anteriormente
      if (
        !uniqueDrivers.has(driver.driverNumber) ||
        driver.bestLapTime < uniqueDrivers.get(driver.driverNumber).bestLapTime
      ) {
        uniqueDrivers.set(driver.driverNumber, driver)
      }
    })

    // Converter o Map de volta para array
    const uniqueStandings = Array.from(uniqueDrivers.values())

    // Ordenar por tempo de volta
    uniqueStandings.sort((a, b) => a.bestLapTime - b.bestLapTime)

    // Atribuir posições
    uniqueStandings.forEach((standing, index) => {
      standing.position = index + 1
    })

    return uniqueStandings
  } catch (error) {
    console.error("Error fetching session standings:", error)
    return []
  }
}

// Nova função para obter os resultados de corrida (RACE ou SPRINT)
export async function getRaceResults(sessionId: string): Promise<RaceResult[]> {
  try {
    console.log(`Buscando resultados de corrida para a sessão ${sessionId}`)
    const { db } = await connectToDatabase()

    // Buscar todos os pilotos da sessão
    const drivers = await getDriversBySessionKey(sessionId)
    console.log(`Encontrados ${drivers.length} pilotos para a sessão ${sessionId}`)

    if (drivers.length === 0) {
      console.log(`Nenhum piloto encontrado para a sessão ${sessionId}`)
      return []
    }

    // Verificar se temos dados de posição para esta sessão
    const positionSample = await db.collection("position").findOne({ session_key: Number.parseInt(sessionId) })

    console.log(`Dados de posição encontrados: ${positionSample ? "Sim" : "Não"}`)

    // Se não tivermos dados de posição, usar a classificação por tempo de volta
    if (!positionSample) {
      console.log(`Sem dados de posição, usando classificação por tempo de volta`)
      const timeBasedResults = await getSessionStandings(sessionId)

      // Converter para o formato RaceResult
      return timeBasedResults.map((driver: any) => ({
        ...driver,
        gap: driver.position === 1 ? "LÍDER" : `+${(driver.bestLapTime - timeBasedResults[0].bestLapTime).toFixed(3)}`,
        interval:
          driver.position === 1
            ? "-"
            : `+${(driver.bestLapTime - timeBasedResults[driver.position - 2].bestLapTime).toFixed(3)}`,
      }))
    }

    // Para cada piloto, buscar sua última posição registrada
    const results = await Promise.all(
      drivers.map(async (driver: any) => {
        console.log(`Processando piloto ${driver.driver_number} (${driver.name_acronym})`)

        // Buscar todas as posições do piloto nesta sessão, ordenadas por data
        const positions = await db
          .collection("position")
          .find({
            session_key: Number.parseInt(sessionId),
            driver_number: driver.driver_number,
          })
          .sort({ date: -1 }) // Ordenar por data decrescente para obter a mais recente primeiro
          .limit(1) // Pegar apenas a mais recente
          .toArray()

        console.log(`Encontradas ${positions.length} posições para o piloto ${driver.driver_number}`)

        // Obter a melhor volta do piloto
        const bestLapInfo = await getBestLapInfo(sessionId, driver.driver_number.toString())

        // Buscar detalhes da melhor volta
        let bestLapSpeed = null
        let sector1Time = null
        let sector2Time = null
        let sector3Time = null

        if (bestLapInfo.bestLapNumber) {
          const bestLap = await db.collection("laps").findOne({
            session_key: Number.parseInt(sessionId),
            driver_number: driver.driver_number,
            lap_number: bestLapInfo.bestLapNumber,
          })

          if (bestLap) {
            bestLapSpeed = bestLap.st_speed || null
            sector1Time = bestLap.duration_sector_1 || null
            sector2Time = bestLap.duration_sector_2 || null
            sector3Time = bestLap.duration_sector_3 || null
          }
        }

        // Calcular o gap para o líder (será preenchido depois)
        return {
          driverNumber: driver.driver_number,
          fullName: driver.full_name,
          nameAcronym: driver.name_acronym,
          teamName: driver.team_name,
          teamColor: driver.team_colour,
          headshotUrl: driver.headshot_url,
          position: positions.length > 0 ? positions[0].position : 999, // Usar 999 para pilotos sem posição
          bestLapTime: bestLapInfo.bestLapTime,
          bestLapNumber: bestLapInfo.bestLapNumber,
          bestLapSpeed: bestLapSpeed,
          sector1Time: sector1Time,
          sector2Time: sector2Time,
          sector3Time: sector3Time,
          gap: null, // Será calculado depois
          interval: null, // Será calculado depois
          lastPosition: positions.length > 0 ? positions[0] : null,
        }
      }),
    )

    console.log(`Processados ${results.length} pilotos com resultados`)

    // Filtrar pilotos sem posição e ordenar por posição
    const validResults = results.filter((driver) => driver.position !== 999).sort((a, b) => a.position - b.position)

    console.log(`${validResults.length} pilotos com posições válidas`)

    // Se não tivermos resultados válidos, retornar array vazio
    if (validResults.length === 0) {
      console.log(`Nenhum resultado válido encontrado`)
      return []
    }

    // Buscar as voltas da sessão para calcular os gaps
    const sessionLaps = await db
      .collection("laps")
      .find({
        session_key: Number.parseInt(sessionId),
      })
      .sort({ lap_number: -1 })
      .limit(1)
      .toArray()

    const totalLaps = sessionLaps.length > 0 ? sessionLaps[0].lap_number : 0
    console.log(`Total de voltas na sessão: ${totalLaps}`)

    // Calcular gaps e intervals
    validResults.forEach((driver, index) => {
      if (index === 0) {
        // O líder não tem gap nem interval
        driver.gap = "LÍDER"
        driver.interval = "-"
      } else {
        // Para os demais pilotos, calcular com base na posição
        // Aqui estamos simplificando, idealmente usaríamos o tempo real
        const positionDiff = driver.position - validResults[0].position
        driver.gap = `+${positionDiff} volta${positionDiff !== 1 ? "s" : ""}`

        const intervalDiff = driver.position - validResults[index - 1].position
        driver.interval = `+${intervalDiff} volta${intervalDiff !== 1 ? "s" : ""}`
      }
    })

    console.log(`Retornando ${validResults.length} resultados processados`)
    return validResults
  } catch (error) {
    console.error("Erro ao buscar resultados da corrida:", error)
    return []
  }
}

// Adicione esta função após a função getBestLapInfo
// Replace the getDriverLapsInStage function with this improved version that handles more date formats and provides better debugging

export async function getDriverLapsInStage(sessionKey: string, driverNumber: number, startTime: Date, endTime: Date) {
  try {
    const { db } = await connectToDatabase()

    // First, let's try to get all laps for this driver in this session
    const allDriverLaps = await db
      .collection("laps")
      .find({
        session_key: Number.parseInt(sessionKey.toString()),
        driver_number: driverNumber,
      })
      .toArray()

    // Try a different approach - use MongoDB's $gte and $lte operators with ISODate strings
    const startISOString = startTime.toISOString()
    const endISOString = endTime.toISOString()

    // Try a direct query with string comparison if date objects aren't working
    const directQueryLaps = await db
      .collection("laps")
      .find({
        session_key: Number.parseInt(sessionKey.toString()),
        driver_number: driverNumber,
        // Try different date formats that might be in the database
        $or: [
          // If date_start is a string
          { date_start: { $gte: startISOString, $lte: endISOString } },
          // If date_start is an object with $date as string
          { "date_start.$date": { $gte: startISOString, $lte: endISOString } },
          // If date_start is an ISODate object
          { date_start: { $gte: new Date(startISOString), $lte: new Date(endISOString) } },
        ],
      })
      .toArray()

    // Buscar os stints do piloto para adicionar informações de pneus
    const stints = await db
      .collection("stints")
      .find({
        session_key: Number.parseInt(sessionKey.toString()),
        driver_number: driverNumber,
      })
      .sort({ stint_number: 1 })
      .toArray()

    // Now filter by date manually to debug the issue
    const filteredLaps = allDriverLaps.filter((lap) => {
      // Get the date from the lap
      let lapDate: Date | null = null
      let lapDateStr = "unknown"

      try {
        // Handle different date formats
        if (lap.date_start instanceof Date) {
          lapDate = lap.date_start
          lapDateStr = lapDate.toISOString()
        } else if (lap.date_start && typeof lap.date_start === "object" && lap.date_start.$date) {
          // Handle MongoDB date format
          if (typeof lap.date_start.$date === "string") {
            lapDate = new Date(lap.date_start.$date)
            lapDateStr = lap.date_start.$date
          } else if (typeof lap.date_start.$date === "number") {
            // Handle timestamp format (milliseconds since epoch)
            lapDate = new Date(lap.date_start.$date)
            lapDateStr = lapDate.toISOString()
          } else if (lap.date_start.$date instanceof Date) {
            lapDate = lap.date_start.$date
            lapDateStr = lapDate.toISOString()
          } else {
            return false
          }
        } else if (typeof lap.date_start === "string") {
          lapDate = new Date(lap.date_start)
          lapDateStr = lap.date_start
        } else {
          return false
        }

        // Check if the lap date is within the stage time range
        const isInRange = lapDate >= startTime && lapDate <= endTime

        return isInRange
      } catch (error) {
        // Capturar erro silenciosamente
        console.error(`Error processing lap date: ${error}`)
        return false
      }
    })

    // Adicionar informações de pneus às voltas filtradas
    return filteredLaps.map((lap: any) => {
      // Encontrar o stint correspondente a esta volta
      const stint = stints.find((s: any) => lap.lap_number >= s.lap_start && lap.lap_number <= s.lap_end)

      const compound = stint ? stint.compound : null

      return {
        lapNumber: lap.lap_number,
        lapTime: lap.lap_duration,
        sector1: lap.duration_sector_1,
        sector2: lap.duration_sector_2,
        sector3: lap.duration_sector_3,
        timestamp: new Date(lap.date_start.$date || lap.date_start),
        compound: compound,
      }
    })
  } catch (error) {
    // Capturar erro silenciosamente
    console.error(`Error fetching laps for driver ${driverNumber} in stage:`, error)
    return []
  }
}

export async function getRaceControlEvents(sessionKey: string) {
  try {
    const { db } = await connectToDatabase()
    const events = await db
      .collection("race_control")
      .find({ session_key: Number.parseInt(sessionKey) })
      .sort({ date: 1 })
      .toArray()

    // Garantir que as datas estão no formato correto
    const processedEvents = events.map((event: any) => {
      // Verificar se a data é um objeto Date do MongoDB
      if (event.date && event.date instanceof Date) {
        return {
          ...event,
          date: { $date: event.date.toISOString() },
        }
      }
      // Verificar se a data é um objeto com $date
      else if (event.date && event.date.$date) {
        // Garantir que $date é uma string ISO
        if (typeof event.date.$date === "string") {
          return event
        } else if (event.date.$date instanceof Date) {
          return {
            ...event,
            date: { $date: event.date.$date.toISOString() },
          }
        }
      }

      // Se não conseguir processar, retornar o evento original
      return event
    })

    return JSON.parse(JSON.stringify(processedEvents))
  } catch (error) {
    console.error("Error fetching race control events:", error)
    return []
  }
}

// Modify the processStages function to correctly identify Sprint Qualifying sessions
// and handle red flags correctly
const processStages = (events: any[], session: any) => {
  try {
    // Filtrar eventos relevantes para determinar os estágios
    const greenLightEvents = events.filter(
      (event) => event.message === "GREEN LIGHT - PIT EXIT OPEN" && event.flag === "GREEN",
    )
    const chequeredFlagEvents = events.filter(
      (event) => event.message === "CHEQUERED FLAG" && event.flag === "CHEQUERED",
    )
    const redFlagEvents = events.filter((event) => event.message === "RED FLAG" && event.flag === "RED")

    // Determinar os períodos de cada estágio
    const stagePeriods = []

    // Check if this is a Sprint Qualifying session based on session name or other indicators
    const isSprintQualifying = session?.session_name.includes("Sprint")
    const stagePrefix = isSprintQualifying ? "SQ" : "Q" // Use SQ for Sprint Qualifying

    // Agrupar eventos por estágio
    // Um estágio começa com GREEN LIGHT e termina com CHEQUERED FLAG
    // Múltiplos GREEN LIGHT após RED FLAG dentro do mesmo estágio não iniciam um novo estágio

    let currentStageIndex = 0
    let currentStageEvents = []
    let stageStartEvent = null
    let stageEndEvent = null

    // Ordenar todos os eventos por data
    const allEvents = [...greenLightEvents, ...chequeredFlagEvents, ...redFlagEvents].sort((a, b) => {
      const dateA = new Date(a.date.$date)
      const dateB = new Date(b.date.$date)
      return dateA.getTime() - dateB.getTime()
    })

    // Processar eventos em ordem cronológica
    for (let i = 0; i < allEvents.length; i++) {
      const event = allEvents[i]

      // Se for um evento GREEN LIGHT e não tivermos um evento de início para o estágio atual
      if (event.message === "GREEN LIGHT - PIT EXIT OPEN" && event.flag === "GREEN" && !stageStartEvent) {
        stageStartEvent = event
        currentStageEvents = [event]
      }
      // Se for um evento RED FLAG e tivermos um evento de início (estágio em andamento)
      else if (event.message === "RED FLAG" && event.flag === "RED" && stageStartEvent) {
        currentStageEvents.push(event)
      }
      // Se for um evento GREEN LIGHT após RED FLAG (reinício do mesmo estágio)
      else if (event.message === "GREEN LIGHT - PIT EXIT OPEN" && event.flag === "GREEN" && stageStartEvent) {
        currentStageEvents.push(event)
      }
      // Se for um evento CHEQUERED FLAG e tivermos um evento de início (finaliza o estágio)
      else if (event.message === "CHEQUERED FLAG" && event.flag === "CHEQUERED" && stageStartEvent) {
        stageEndEvent = event
        currentStageEvents.push(event)

        // Criar o período do estágio
        let startTimeStr = stageStartEvent.date.$date
        let endTimeStr = stageEndEvent.date.$date

        // Verificar se as strings de data são válidas
        if (typeof startTimeStr !== "string" || !startTimeStr.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
          startTimeStr = new Date().toISOString() // Usar data atual como fallback
        }

        if (typeof endTimeStr !== "string" || !endTimeStr.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
          endTimeStr = new Date().toISOString() // Usar data atual como fallback
        }

        stagePeriods.push({
          name: `${stagePrefix}${currentStageIndex + 1}`,
          startTime: new Date(startTimeStr),
          endTime: new Date(endTimeStr),
          events: currentStageEvents,
        })

        // Resetar para o próximo estágio
        currentStageIndex++
        stageStartEvent = null
        stageEndEvent = null
        currentStageEvents = []
      }
    }

    // Se tivermos um estágio iniciado mas não finalizado, usar a data atual como fim
    if (stageStartEvent && !stageEndEvent) {
      let startTimeStr = stageStartEvent.date.$date
      if (typeof startTimeStr !== "string" || !startTimeStr.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
        startTimeStr = new Date().toISOString()
      }

      stagePeriods.push({
        name: `${stagePrefix}${currentStageIndex + 1}`,
        startTime: new Date(startTimeStr),
        endTime: new Date(), // Usar data atual como fim
        events: currentStageEvents,
      })
    }

    // Limitar a 3 estágios (Q1, Q2, Q3 ou SQ1, SQ2, SQ3)
    return stagePeriods.slice(0, 3)
  } catch (err) {
    console.error("Error processing stages:", err)
    return []
  }
}

// Let's also modify the getQualifyingResults function to fix the issue with sector times
export async function getQualifyingResults(sessionKey: string): Promise<QualifyingResult> {
  try {
    // Buscar a sessão para verificar se é Sprint Qualifying ou Qualifying regular
    const session = await getSessionById(sessionKey)
    const isSprintQualifying = session?.session_name.includes("Sprint")

    // Buscar eventos de race control para determinar os estágios do qualifying
    const raceControlEvents = await getRaceControlEvents(sessionKey)

    if (raceControlEvents.length === 0) {
      return {
        stages: [],
        finalGrid: [],
      }
    }

    // Se não tivermos eventos suficientes, retornar resultado simplificado
    if (raceControlEvents.length < 2) {
      return await getSimplifiedQualifyingResults(sessionKey, isSprintQualifying)
    }

    const stagePeriods = processStages(raceControlEvents, session)

    // Se não tivermos eventos suficientes, retornar resultado simplificado
    if (stagePeriods.length < 2) {
      return await getSimplifiedQualifyingResults(sessionKey, isSprintQualifying)
    }

    // Buscar todos os pilotos da sessão
    const drivers = await getDriversBySessionKey(sessionKey)

    // Buscar todas as voltas da sessão
    const { db } = await connectToDatabase()
    const laps = await db
      .collection("laps")
      .find({ session_key: Number.parseInt(sessionKey) })
      .sort({ date_start: 1 })
      .toArray()

    // Buscar todos os stints da sessão para informações de pneus
    const stints = await db
      .collection("stints")
      .find({ session_key: Number.parseInt(sessionKey) })
      .sort({ stint_number: 1 })
      .toArray()

    // Se não houver voltas ou pilotos, retornar resultado vazio
    if (laps.length === 0 || drivers.length === 0) {
      return {
        stages: [],
        finalGrid: [],
      }
    }

    // Criar os estágios com os pilotos e suas melhores voltas em cada estágio
    const stages: QualifyingStage[] = []
    const eliminatedDrivers: number[] = []
    const driverBestTimes: Record<
      number,
      {
        q1Time: number | null
        q2Time: number | null
        q3Time: number | null
        q1Compound: string | null
        q2Compound: string | null
        q3Compound: string | null
        q1LapNumber: number | null
        q2LapNumber: number | null
        q3LapNumber: number | null
      }
    > = {}

    for (let i = 0; i < stagePeriods.length; i++) {
      const stagePeriod = stagePeriods[i]
      const stageDriverResults: DriverQualifyingResult[] = []

      // Para cada piloto, encontrar sua melhor volta neste estágio
      for (const driver of drivers) {
        // Pular pilotos já eliminados em estágios anteriores (exceto para o grid final)
        if (i > 0 && eliminatedDrivers.includes(driver.driver_number)) {
          continue
        }

        // Buscar todas as voltas deste piloto neste estágio
        const driverLaps = laps.filter((lap: any) => {
          if (lap.driver_number !== driver.driver_number || lap.lap_duration === null) {
            return false
          }

          // Get the date from the lap
          let lapDate: Date

          // Handle different date formats
          if (typeof lap.date_start === "string") {
            lapDate = new Date(lap.date_start)
          } else if (lap.date_start && typeof lap.date_start === "object" && lap.date_start.$date) {
            // Handle MongoDB date format
            if (typeof lap.date_start.$date === "string") {
              lapDate = new Date(lap.date_start.$date)
            } else if (lap.date_start.$date instanceof Date) {
              lapDate = lap.date_start.$date
            } else {
              return false
            }
          } else if (lap.date_start instanceof Date) {
            lapDate = lap.date_start
          } else {
            return false
          }

          // Check if the lap date is within the stage time range
          return lapDate >= stagePeriod.startTime && lapDate <= stagePeriod.endTime
        })

        // Obter todas as voltas válidas para este piloto neste estágio
        const allLaps = await getDriverLapsInStage(
          sessionKey,
          driver.driver_number,
          stagePeriod.startTime,
          stagePeriod.endTime,
        )

        // Encontrar a melhor volta
        const bestLap = driverLaps.sort(
          (a: any, b: any) =>
            (a.lap_duration || Number.POSITIVE_INFINITY) - (b.lap_duration || Number.POSITIVE_INFINITY),
        )[0]

        // Inicializar o registro de tempos para este piloto se ainda não existir
        if (!driverBestTimes[driver.driver_number]) {
          driverBestTimes[driver.driver_number] = {
            q1Time: null,
            q2Time: null,
            q3Time: null,
            q1Compound: null,
            q2Compound: null,
            q3Compound: null,
            q1LapNumber: null,
            q2LapNumber: null,
            q3LapNumber: null,
          }
        }

        // Encontrar o stint correspondente a esta volta para obter o composto do pneu
        let compound = null
        if (bestLap) {
          const stint = stints.find(
            (s: any) =>
              s.driver_number === driver.driver_number &&
              bestLap.lap_number >= s.lap_start &&
              bestLap.lap_number <= s.lap_end,
          )
          compound = stint ? stint.compound : null
        }

        // Armazenar o melhor tempo e composto para este estágio
        if (bestLap && bestLap.lap_duration) {
          if (i === 0) {
            driverBestTimes[driver.driver_number].q1Time = bestLap.lap_duration
            driverBestTimes[driver.driver_number].q1Compound = compound
            driverBestTimes[driver.driver_number].q1LapNumber = bestLap.lap_number
          } else if (i === 1) {
            driverBestTimes[driver.driver_number].q2Time = bestLap.lap_duration
            driverBestTimes[driver.driver_number].q2Compound = compound
            driverBestTimes[driver.driver_number].q2LapNumber = bestLap.lap_number
          } else if (i === 2) {
            driverBestTimes[driver.driver_number].q3Time = bestLap.lap_duration
            driverBestTimes[driver.driver_number].q3Compound = compound
            driverBestTimes[driver.driver_number].q3LapNumber = bestLap.lap_number
          }
        }

        if (bestLap) {
          // Extract sector times from the best lap
          const sector1Time = bestLap.duration_sector_1
          const sector2Time = bestLap.duration_sector_2
          const sector3Time = bestLap.duration_sector_3

          stageDriverResults.push({
            driverNumber: driver.driver_number,
            fullName: driver.full_name,
            nameAcronym: driver.name_acronym,
            teamName: driver.team_name,
            teamColor: driver.team_colour,
            headshotUrl: driver.headshot_url,
            bestLapTime: bestLap.lap_duration,
            bestLapNumber: bestLap.lap_number,
            position: 0, // Será definido após a ordenação
            eliminated: false, // Será definido após a ordenação
            compound: compound,
            // Add sector times
            sector1Time: sector1Time,
            sector2Time: sector2Time,
            sector3Time: sector3Time,
            // Add best lap details
            bestLapDetails: {
              sector1: sector1Time,
              sector2: sector2Time,
              sector3: sector3Time,
              lapNumber: bestLap.lap_number,
              compound: compound,
            },
            // Add all laps for this driver in this stage
            allLaps: allLaps,
          })
        } else {
          // If the driver doesn't have a lap in this stage, add with null times
          stageDriverResults.push({
            driverNumber: driver.driver_number,
            fullName: driver.full_name,
            nameAcronym: driver.name_acronym,
            teamName: driver.team_name,
            teamColor: driver.team_colour,
            headshotUrl: driver.headshot_url,
            bestLapTime: null,
            bestLapNumber: null,
            position: 0,
            eliminated: false,
            compound: null,
            // Add null sector times
            sector1Time: null,
            sector2Time: null,
            sector3Time: null,
            bestLapDetails: null,
            // Add empty laps array
            allLaps: [],
          })
        }
      }

      // Ordenar os resultados por tempo de volta
      stageDriverResults.sort((a, b) => {
        if (a.bestLapTime === null) return 1
        if (b.bestLapTime === null) return -1
        return a.bestLapTime - b.bestLapTime
      })

      // Atribuir posições
      stageDriverResults.forEach((result, index) => {
        result.position = index + 1
      })

      // Marcar pilotos eliminados (os 5 últimos em Q1 e Q2)
      if (i < stagePeriods.length - 1) {
        // Número de pilotos a eliminar (geralmente 5 em Q1 e Q2)
        const eliminationCount = 5
        const totalDrivers = stageDriverResults.length

        // Marcar os últimos 5 pilotos como eliminados
        for (let j = Math.max(0, totalDrivers - eliminationCount); j < totalDrivers; j++) {
          if (stageDriverResults[j]) {
            stageDriverResults[j].eliminated = true
            eliminatedDrivers.push(stageDriverResults[j].driverNumber)
          }
        }
      }

      // Adicionar o estágio
      stages.push({
        name: stagePeriod.name,
        startTime: stagePeriod.startTime,
        endTime: stagePeriod.endTime,
        drivers: stageDriverResults,
      })
    }

    // Create the grid final (include all drivers from all stages)
    let finalGrid: DriverQualifyingResult[] = []

    // First, add all drivers from Q3/SQ3 (the last stage)
    if (stages.length > 0) {
      finalGrid = [...stages[stages.length - 1].drivers]
    }

    // Then add drivers eliminated in Q2/SQ2 (if we have at least 2 stages)
    if (stages.length > 1) {
      const q2Stage = stages[stages.length - 2]
      const eliminatedInQ2 = q2Stage.drivers.filter((driver) => driver.eliminated)
      finalGrid = [...finalGrid, ...eliminatedInQ2]
    }

    // Finally add drivers eliminated in Q1/SQ1 (if we have at least 3 stages)
    if (stages.length > 2) {
      const q1Stage = stages[stages.length - 3]
      const eliminatedInQ1 = q1Stage.drivers.filter((driver) => driver.eliminated)
      finalGrid = [...finalGrid, ...eliminatedInQ1]
    }

    // Sort the final grid by position
    finalGrid.sort((a, b) => a.position - b.position)

    // Adicionar os tempos e compostos de cada estágio ao grid final
    finalGrid.forEach((driver) => {
      const times = driverBestTimes[driver.driverNumber]
      if (times) {
        driver.q1Time = times.q1Time
        driver.q2Time = times.q2Time
        driver.q3Time = times.q3Time
        driver.q1Compound = times.q1Compound
        driver.q2Compound = times.q2Compound
        driver.q3Compound = times.q3Compound
        driver.q1LapNumber = times.q1LapNumber
        driver.q2LapNumber = times.q2LapNumber
        driver.q3LapNumber = times.q3LapNumber
      }
    })

    return {
      stages,
      finalGrid,
    }
  } catch (error) {
    // Capturar erro silenciosamente
    console.error("Erro ao buscar resultados do qualifying:", error)
    // Em vez de lançar um erro, retornar um resultado vazio
    return {
      stages: [],
      finalGrid: [],
    }
  }
}

// Função auxiliar para criar resultados simplificados quando não temos dados suficientes
async function getSimplifiedQualifyingResults(
  sessionKey: string,
  isSprintQualifying: boolean,
): Promise<QualifyingResult> {
  try {
    // Buscar todos os pilotos da sessão
    const drivers = await getDriversBySessionKey(sessionKey)

    // Buscar todas as voltas da sessão
    const { db } = await connectToDatabase()
    const laps = await db
      .collection("laps")
      .find({ session_key: Number.parseInt(sessionKey) })
      .sort({ date_start: 1 })
      .toArray()

    // Buscar todos os stints da sessão para informações de pneus
    const stints = await db
      .collection("stints")
      .find({ session_key: Number.parseInt(sessionKey) })
      .sort({ stint_number: 1 })
      .toArray()

    // Se não houver voltas ou pilotos, retornar resultado vazio
    if (laps.length === 0 || drivers.length === 0) {
      return {
        stages: [],
        finalGrid: [],
      }
    }

    // Buscar a sessão para obter as datas
    const session = await getSessionById(sessionKey)

    // Criar um único estágio com todos os pilotos e suas melhores voltas
    const driverResults: DriverQualifyingResult[] = []
    const driverBestTimes: Record<
      number,
      {
        q1Time: number | null
        q2Time: number | null
        q3Time: number | null
        q1Compound: string | null
        q2Compound: string | null
        q3Compound: string | null
      }
    > = {}

    for (const driver of drivers) {
      // Buscar as voltas deste piloto
      const driverLaps = laps.filter((lap: any) => {
        return lap.driver_number === driver.driver_number
      })

      // Encontrar a melhor volta do piloto
      const bestLap = driverLaps
        .filter((lap: any) => lap.lap_duration !== null)
        .sort(
          (a: any, b: any) =>
            (a.lap_duration || Number.POSITIVE_INFINITY) - (b.lap_duration || Number.POSITIVE_INFINITY),
        )[0]

      // Encontrar o stint correspondente a esta volta para obter o composto do pneu
      let compound = null
      if (bestLap) {
        const stint = stints.find(
          (s: any) =>
            s.driver_number === driver.driver_number &&
            bestLap.lap_number >= s.lap_start &&
            bestLap.lap_number <= s.lap_end,
        )
        compound = stint ? stint.compound : null
      }

      // Armazenar o melhor tempo para o estágio único
      if (bestLap && bestLap.lap_duration) {
        driverBestTimes[driver.driver_number] = {
          q1Time: bestLap.lap_duration,
          q2Time: null,
          q3Time: null,
          q1Compound: compound,
          q2Compound: null,
          q3Compound: null,
        }
      } else {
        driverBestTimes[driver.driver_number] = {
          q1Time: null,
          q2Time: null,
          q3Time: null,
          q1Compound: null,
          q2Compound: null,
          q3Compound: null,
        }
      }

      driverResults.push({
        driverNumber: driver.driver_number,
        fullName: driver.full_name,
        nameAcronym: driver.name_acronym,
        teamName: driver.team_name,
        teamColor: driver.team_colour,
        headshotUrl: driver.headshot_url,
        bestLapTime: bestLap ? bestLap.lap_duration : null,
        bestLapNumber: bestLap ? bestLap.lap_number : null,
        position: 0, // Será definido após a ordenação
        eliminated: false,
        compound: compound,
        q1Time: bestLap ? bestLap.lap_duration : null,
        q2Time: null,
        q3Time: null,
        q1Compound: compound,
        q2Compound: null,
        q3Compound: null,
      })
    }

    // Ordenar os resultados por tempo de volta
    driverResults.sort((a, b) => {
      if (a.bestLapTime === null) return 1
      if (b.bestLapTime === null) return -1
      return a.bestLapTime - b.bestLapTime
    })

    // Atribuir posições
    driverResults.forEach((result, index) => {
      result.position = index + 1
    })

    // Criar um único estágio
    const stageName = isSprintQualifying ? "SQ1" : "Q1"
    const stage: QualifyingStage = {
      name: stageName,
      startTime: session ? new Date(session.date_start.$date) : new Date(),
      endTime: session ? new Date(session.date_end.$date) : new Date(),
      drivers: driverResults,
    }

    return {
      stages: [stage],
      finalGrid: [...driverResults],
    }
  } catch (error) {
    // Capturar erro silenciosamente
    console.error("Erro ao criar resultados simplificados:", error)
    return {
      stages: [],
      finalGrid: [],
    }
  }
}
