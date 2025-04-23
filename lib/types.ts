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
  compound?: string // Adicionado a partir do stint
  tyre_age?: number // Adicionado a partir do stint
}

export interface Stint {
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
}
