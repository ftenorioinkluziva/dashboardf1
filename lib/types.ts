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
