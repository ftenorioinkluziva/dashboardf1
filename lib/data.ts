"use server"

import type { QualifyingResult, QualifyingStage, DriverQualifyingResult, RaceResult, Lap } from "./types"
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

export async function getLapsBySessionAndDriver(sessionId: string, driverNumber: string): Promise<Lap[]> {
  try {
    console.log(`Buscando voltas para sessão ${sessionId} e piloto ${driverNumber}`)
    const { db } = await connectToDatabase()

    // Converter driverNumber para número se necessário
    const driverNum = Number.parseInt(driverNumber, 10)

    // Buscar informações da sessão para obter as chaves
    const session = await db.collection("sessions").findOne({ _id: sessionId })

    if (!session) {
      console.error(`Sessão ${sessionId} não encontrada`)
      return []
    }

    // Buscar voltas do piloto
    const laps = await db
      .collection("laps")
      .find({
        session_id: sessionId,
        driver_number: driverNum,
      })
      .sort({ lap_number: 1 })
      .toArray()

    console.log(`Encontradas ${laps.length} voltas para o piloto ${driverNumber}`)

    return laps as Lap[]
  } catch (error) {
    console.error("Erro ao buscar voltas do piloto:", error)
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
        let i1Speed = null
        let i2Speed = null
        let stSpeed = null

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
            i1Speed = bestLap.i1_speed || null
            i2Speed = bestLap.i2_speed || null
            stSpeed = bestLap.st_speed || null
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
          i1Speed: i1Speed,
          i2Speed: i2Speed,
          stSpeed: stSpeed,
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
        let i1Speed = null
        let i2Speed = null
        let stSpeed = null

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
            i1Speed = bestLap.i1_speed || null
            i2Speed = bestLap.i2_speed || null
            stSpeed = bestLap.st_speed || null
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
          i1Speed: i1Speed,
          i2Speed: i2Speed,
          stSpeed: stSpeed,
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

export async function getQualifyingResults(sessionId: string): Promise<QualifyingResult> {
  try {
    const { db } = await connectToDatabase()

    // Buscar todos os pilotos da sessão
    const drivers = await getDriversBySessionKey(sessionId)

    // Buscar todas as voltas da sessão
    const laps = await db
      .collection("laps")
      .find({ session_key: Number.parseInt(sessionId) })
      .toArray()

    // Buscar os stints da sessão
    const stints = await db
      .collection("stints")
      .find({ session_key: Number.parseInt(sessionId) })
      .toArray()

    // Função auxiliar para processar os estágios
    const processStages = async (): Promise<QualifyingStage[]> => {
      // Buscar eventos de controle de corrida para determinar os estágios
      const raceControlEvents = await db
        .collection("race_control")
        .find({ session_key: Number.parseInt(sessionId) })
        .sort({ date: 1 })
        .toArray()

      // Filtrar eventos relevantes para determinar os estágios
      const greenLightEvents = raceControlEvents.filter(
        (event) => event.message === "GREEN LIGHT - PIT EXIT OPEN" && event.flag === "GREEN",
      )
      const chequeredFlagEvents = raceControlEvents.filter(
        (event) => event.message === "CHEQUERED FLAG" && event.flag === "CHEQUERED",
      )

      // Determinar os períodos de cada estágio
      const stagePeriods = []
      const stagePrefix = "Q" // Assumir qualifying regular

      // Para cada evento de luz verde (exceto o último), encontrar a bandeira quadriculada correspondente
      for (let i = 0; i < Math.min(greenLightEvents.length, 3); i++) {
        const startEvent = greenLightEvents[i]
        let endEvent

        // Se não for o último evento de luz verde, o fim é o próximo evento de luz verde
        // Caso contrário, procurar a última bandeira quadriculada
        if (i < greenLightEvents.length - 1) {
          endEvent = greenLightEvents[i + 1]
        } else if (chequeredFlagEvents.length > 0) {
          // Pegar a última bandeira quadriculada
          endEvent = chequeredFlagEvents[chequeredFlagEvents.length - 1]
        } else {
          // Se não houver bandeira quadriculada, usar a data atual
          endEvent = {
            date: { $date: new Date().toISOString() },
          }
        }

        // Garantir que as datas sejam strings ISO válidas antes de criar objetos Date
        let startTimeStr = startEvent.date.$date
        let endTimeStr = endEvent.date.$date

        // Verificar se as strings de data são válidas
        if (typeof startTimeStr !== "string" || !startTimeStr.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
          startTimeStr = new Date().toISOString() // Usar data atual como fallback
        }

        if (typeof endTimeStr !== "string" || !endTimeStr.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
          endTimeStr = new Date().toISOString() // Usar data atual como fallback
        }

        stagePeriods.push({
          name: `${stagePrefix}${i + 1}`,
          startTime: new Date(startTimeStr),
          endTime: new Date(endTimeStr),
        })
      }

      return stagePeriods
    }

    // Processar os estágios
    const stagesData = await processStages()

    // Criar um array para armazenar os resultados de cada piloto em cada estágio
    const finalGrid: DriverQualifyingResult[] = await Promise.all(
      drivers.map(async (driver: any) => {
        // Inicializar os tempos como nulos
        let q1Time: number | null = null
        let q2Time: number | null = null
        let q3Time: number | null = null
        let q1Compound: string | null = null
        let q2Compound: string | null = null
        let q3Compound: string | null = null
        let q1LapNumber: number | null = null
        let q2LapNumber: number | null = null
        let q3LapNumber: number | null = null

        // Para cada estágio, encontrar a melhor volta do piloto
        for (const stage of stagesData) {
          // Filtrar as voltas do piloto dentro do período do estágio
          const driverLaps = laps.filter(
            (lap: any) =>
              lap.driver_number === driver.driver_number &&
              new Date(lap.date_start.$date) >= stage.startTime &&
              new Date(lap.date_start.$date) <= stage.endTime &&
              lap.lap_duration !== null,
          )

          // Ordenar as voltas por tempo para encontrar a melhor volta
          const bestLap = driverLaps.sort((a, b) => a.lap_duration - b.lap_duration)[0]

          // Se houver uma melhor volta, salvar o tempo e o composto
          if (bestLap) {
            const compound = stints.find(
              (s: any) => bestLap.lap_number >= s.lap_start && bestLap.lap_number <= s.lap_end,
            )?.compound

            if (stage.name === "Q1") {
              q1Time = bestLap.lap_duration
              q1Compound = compound
              q1LapNumber = bestLap.lap_number
            } else if (stage.name === "Q2") {
              q2Time = bestLap.lap_duration
              q2Compound = compound
              q2LapNumber = bestLap.lap_number
            } else if (stage.name === "Q3") {
              q3Time = bestLap.lap_duration
              q3Compound = compound
              q3LapNumber = bestLap.lap_number
            }
          }
        }

        return {
          driverNumber: driver.driver_number,
          fullName: driver.full_name,
          nameAcronym: driver.name_acronym,
          teamName: driver.team_name,
          teamColor: driver.team_colour,
          headshotUrl: driver.headshot_url,
          bestLapTime: q3Time || q2Time || q1Time || null,
          bestLapNumber: q3LapNumber || q2LapNumber || q1LapNumber || null,
          position: 0, // A posição será definida posteriormente
          eliminated: false, // A eliminação será definida posteriormente
          compound: q3Compound || q2Compound || q1Compound || null,
          q1Time,
          q2Time,
          q3Time,
          q1Compound,
          q2Compound,
          q3Compound,
          q1LapNumber,
          q2LapNumber,
          q3LapNumber,
        }
      }),
    )

    // Ordenar os pilotos com base no melhor tempo em Q3, Q2 ou Q1
    finalGrid.sort((a, b) => {
      if (a.q3Time !== null && b.q3Time !== null) {
        return a.q3Time - b.q3Time
      } else if (a.q2Time !== null && b.q2Time !== null) {
        return a.q2Time - b.q2Time
      } else if (a.q1Time !== null && b.q1Time !== null) {
        return a.q1Time - b.q1Time
      } else {
        return 0 // Manter a ordem original se nenhum tempo estiver disponível
      }
    })

    // Definir a posição e a eliminação
    finalGrid.forEach((driver, index) => {
      driver.position = index + 1
      driver.eliminated = driver.q3Time === null && driver.q2Time === null && driver.q1Time === null ? true : false
    })

    return {
      stages: stagesData,
      finalGrid: finalGrid,
    }
  } catch (error) {
    console.error("Error fetching qualifying results:", error)
    return { stages: [], finalGrid: [] }
  }
}

// Restante do código permanece o mesmo..."
