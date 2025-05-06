export interface Meeting {
  _id: { $numberLong: string }
  meeting_key: number
  circuit_key: number
  circuit_short_name: string
  meeting_code: string
  location: string
  country_key: number
  country_code: string
  country_name: string
  meeting_name: string
  meeting_official_name: string
  gmt_offset: string
  date_start: { $date: string }
  year: number
  _key: string
}

export interface Session {
  _id: { $numberLong: string }
  meeting_key: number
  session_key: number
  location: string
  date_start: { $date: string }
  date_end: { $date: string }
  session_type: string
  session_name: string
  country_key: number
  country_code: string
  country_name: string
  circuit_key: number
  circuit_short_name: string
  gmt_offset: string
  year: number
  _key: string
}

export interface Driver {
  _id: { $numberLong: string }
  meeting_key: number
  session_key: number
  driver_number: number
  broadcast_name: string
  full_name: string
  name_acronym: string
  team_name: string
  team_colour: string
  first_name: string
  last_name: string
  headshot_url: string
  country_code: string | null
  _key: string
}

export interface DriverLapData {
  lap_number: number
  lap_time: number
  position: number
  speed: number
  sector_times: number[]
}

export interface Lap {
  lap_number: number
  lap_duration?: number
  compound?: string
  duration_sector_1?: number
  duration_sector_2?: number
  duration_sector_3?: number
  is_personal_best?: boolean
  _id: { $numberLong: string }
  meeting_key: number
  session_key: number
  driver_number: number
  lap_number: number
  date_start: { $date: string }
  duration_sector_1: number | null
  duration_sector_2: number | null
  duration_sector_3: number | null
  i1_speed: number | null
  i2_speed: number | null
  is_pit_out_lap: boolean
  lap_duration: number | null
  segments_sector_1: number[]
  segments_sector_2: number[]
  segments_sector_3: number[]
  st_speed: number | null
  _key: string
  tyre_age?: number // Adicionado a partir do stint
  // Flag para indicar a melhor volta pessoal

  // Aliases para compatibilidade com diferentes componentes
  sector1_time?: number | null
  sector2_time?: number | null
  sector3_time?: number | null
  lap_time?: number | null
  tyre_compound?: string
  speed_i1?: number | null
  speed_i2?: number | null
  speed_ist?: number | null
}

export interface Stint {
  stint_number: number
  compound: string
  lap_start: number
  lap_end: number
  _id: { $numberLong: string }
  meeting_key: number
  session_key: number
  stint_number: number
  driver_number: number
  lap_start: number
  lap_end: number
  compound: string
  tyre_age_at_start: number
  _date_start_last_lap: { $date: string }
  _key: string
  best_lap_time?: number | null
  best_lap_number?: number | null
  sector1_time?: number | null
  sector2_time?: number | null
  sector3_time?: number | null
}

export interface SegmentColor {
  value: number
  color: string
  cssColor: string
}

export interface Position {
  _id: { $numberLong: string }
  meeting_key: number
  session_key: number
  driver_number: number
  date: { $date: string }
  position: number
  _key: string
}

export interface DriverStanding {
  driverNumber: number
  fullName: string
  nameAcronym: string
  teamName: string
  teamColor: string
  headshotUrl: string
  bestLapTime: number
  bestLapNumber: number
  position: number
  bestLapSpeed?: number | null
  sector1Time?: number | null
  sector2Time?: number | null
  sector3Time?: number | null
  i1Speed?: number
  i2Speed?: number
  stSpeed?: number
}

export interface RaceResult {
  driverNumber: number
  fullName: string
  nameAcronym: string
  teamName: string
  teamColor: string
  headshotUrl: string
  position: number
  bestLapTime: number | null
  bestLapNumber: number | null
  bestLapSpeed?: number | null
  sector1Time?: number | null
  sector2Time?: number | null
  sector3Time?: number | null
  gap: string | null
  interval: string | null
  lastPosition: any | null
  i1Speed?: number | null
  i2Speed?: number | null
  stSpeed?: number | null
}

export interface PitStop {
  _id: { $numberLong: string }
  meeting_key: number
  session_key: number
  driver_number: number
  lap_number: number
  pit_duration: number
  total_duration: number
  date: { $date: string }
  previous_compound?: string
  new_compound?: string
  _key: string
}

export interface TeamRadio {
  _id: { $numberLong: string }
  meeting_key: number
  session_key: number
  driver_number: number
  lap_number: number
  date: { $date: string }
  message: string
  direction: "to_driver" | "from_driver"
  _key: string
}

export interface RaceControl {
  _id: { $numberLong: string }
  meeting_key: number
  session_key: number
  date: { $date: string }
  driver_number: number | null
  lap_number: number | null
  category: string
  flag: string
  scope: string
  sector: number | null
  message: string
  _key: string
}

export interface QualifyingStage {
  name: string
  startTime: Date
  endTime: Date
  drivers: DriverQualifyingResult[]
}

// Adicione o tipo para representar uma volta individual
export interface LapData {
  lapNumber: number
  lapTime: number
  sector1: number | null
  sector2: number | null
  sector3: number | null
  timestamp: Date
  compound?: string | null
}

// Modifique a interface DriverQualifyingResult para incluir informações de pneus específicas para cada sessão
export interface DriverQualifyingResult {
  driverNumber: number
  fullName: string
  nameAcronym: string
  teamName: string
  teamColor: string
  headshotUrl: string
  bestLapTime: number | null
  bestLapNumber: number | null
  position: number
  eliminated: boolean
  compound: string | null
  q1Time?: number | null
  q2Time?: number | null
  q3Time?: number | null
  q1Compound?: string | null
  q2Compound?: string | null
  q3Compound?: string | null
  q1LapNumber?: number | null
  q2LapNumber?: number | null
  q3LapNumber?: number | null
  sector1Time?: number | null
  sector2Time?: number | null
  sector3Time?: number | null
  bestLapDetails?: {
    sector1: number | null
    sector2: number | null
    sector3: number | null
    lapNumber: number | null
    compound: string | null
  } | null
  allLaps?: LapData[] // Adicione esta linha para incluir todas as voltas
}

export interface QualifyingResult {
  stages: QualifyingStage[]
  finalGrid: DriverQualifyingResult[]
}
