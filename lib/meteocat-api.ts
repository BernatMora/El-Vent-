// API Meteocat XEMA - Dades reals de l'estació de Sant Pere Pescador
// Documentació: https://apidocs.meteocat.gencat.cat/documentacio/dades-mesurades/

const METEOCAT_BASE = "https://api.meteo.cat/xema/v1"

// Codis de variables Meteocat (oficials)
const VARIABLE_CODES = {
  WIND_SPEED_10M: 30,      // Velocitat del vent a 10m (m/s)
  WIND_DIRECTION_10M: 31,  // Direcció del vent a 10m (°)
  WIND_GUST_10M: 50,       // Ratxa màxima del vent a 10m (m/s)
  TEMPERATURE: 32,         // Temperatura (°C)
  HUMIDITY: 33,            // Humitat relativa (%)
}

// Estacions per ordre de prioritat (la primera és la del spot, la resta fallbacks propers)
// U2 = Sant Pere Pescador (3m, dins del spot)
// W2 = Torroella de Fluvià (7m, ~4 km O)
// W3 = Ventalló (4m, ~5 km SO)
// D4 = Roses (23m, ~10 km NE)
const STATION_CHAIN = [
  { code: "U2", name: "Sant Pere Pescador" },
  { code: "W2", name: "Torroella de Fluvià" },
  { code: "W3", name: "Ventalló" },
  { code: "D4", name: "Roses" },
] as const

// Mantenir constant per compatibilitat amb codi existent
const STATION_CODE = STATION_CHAIN[0].code

export interface MeteocatCurrentConditions {
  windSpeed: number        // en nusos
  windDirection: number    // en graus
  windGust: number         // en nusos
  temperature: number      // en °C
  humidity: number         // en %
  lastUpdate: string
  stationName: string
  stationCode: string
  isFallback: boolean      // true si no és l'estació primària (U2)
  isReal: true
  source: "Meteocat XEMA"
}

export interface MeteocatReading {
  time: string
  windSpeed: number
  windDirection: number
  windGust: number
  temperature: number
  humidity: number
  isReal: true
  source: "Meteocat XEMA"
}

// Convertir m/s a nusos
function msToKnots(ms: number): number {
  return Math.round(ms * 1.94384)
}

// Headers amb API key
function getHeaders(): HeadersInit {
  const apiKey = process.env.METEOCAT_API_KEY
  if (!apiKey) {
    throw new Error("METEOCAT_API_KEY no configurada")
  }
  return {
    "X-Api-Key": apiKey,
    "Accept": "application/json"
  }
}

// Obtenir les últimes lectures d'una variable per una estació concreta
async function getLatestReadingFromStation(stationCode: string, variableCode: number): Promise<{ value: number; time: string } | null> {
  try {
    const url = `${METEOCAT_BASE}/variables/mesurades/${variableCode}/ultimes?codiEstacio=${stationCode}`

    const response = await fetch(url, {
      headers: getHeaders(),
      next: { revalidate: 300 } // Cache 5 minuts
    })

    if (!response.ok) {
      console.error(`Meteocat ${stationCode} var ${variableCode}: HTTP ${response.status}`)
      return null
    }

    const data = await response.json()

    if (data.lectures && data.lectures.length > 0) {
      const lastReading = data.lectures[data.lectures.length - 1]
      return {
        value: lastReading.valor,
        time: lastReading.data
      }
    }

    return null
  } catch (error) {
    console.error(`Error obtenint ${stationCode} var ${variableCode}:`, error)
    return null
  }
}

// Versió legacy (estació per defecte) — mantinguda per compatibilitat
async function getLatestReading(variableCode: number): Promise<{ value: number; time: string } | null> {
  return getLatestReadingFromStation(STATION_CODE, variableCode)
}

// Obtenir totes les dades d'un dia per una estació
async function getDayReadings(date: Date): Promise<any | null> {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  try {
    const url = `${METEOCAT_BASE}/estacions/mesurades/${STATION_CODE}/${year}/${month}/${day}`
    
    const response = await fetch(url, {
      headers: getHeaders(),
      next: { revalidate: 300 }
    })

    if (!response.ok) {
      console.error(`Error Meteocat dia: ${response.status}`)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error("Error obtenint dades del dia:", error)
    return null
  }
}

// Obtenir condicions actuals — prova la cadena d'estacions fins trobar dades vàlides
export async function getMeteocatCurrentConditions(): Promise<MeteocatCurrentConditions | null> {
  console.log(`🌡️ Obtenint dades reals de Meteocat (cadena: ${STATION_CHAIN.map(s => s.code).join(" → ")})...`)

  for (let i = 0; i < STATION_CHAIN.length; i++) {
    const station = STATION_CHAIN[i]
    const isFallback = i > 0

    try {
      const [windSpeed, windDirection, windGust, temperature, humidity] = await Promise.all([
        getLatestReadingFromStation(station.code, VARIABLE_CODES.WIND_SPEED_10M),
        getLatestReadingFromStation(station.code, VARIABLE_CODES.WIND_DIRECTION_10M),
        getLatestReadingFromStation(station.code, VARIABLE_CODES.WIND_GUST_10M),
        getLatestReadingFromStation(station.code, VARIABLE_CODES.TEMPERATURE),
        getLatestReadingFromStation(station.code, VARIABLE_CODES.HUMIDITY),
      ])

      if (!windSpeed) {
        console.warn(`⚠️ Estació ${station.code} (${station.name}) sense dades de vent — provant següent`)
        continue
      }

      // Validar que la lectura sigui recent (< 90 min)
      const readingAge = Date.now() - new Date(windSpeed.time).getTime()
      if (readingAge > 90 * 60 * 1000) {
        console.warn(`⚠️ Estació ${station.code} obsoleta (${Math.round(readingAge / 60000)} min) — provant següent`)
        continue
      }

      const windSpeedKnots = msToKnots(windSpeed.value)
      const windGustKnots = windGust ? msToKnots(windGust.value) : Math.round(windSpeedKnots * 1.3)

      const result: MeteocatCurrentConditions = {
        windSpeed: windSpeedKnots,
        windDirection: Math.round(windDirection?.value ?? 0),
        windGust: Math.max(windGustKnots, windSpeedKnots),
        temperature: Math.round(temperature?.value ?? 20),
        humidity: Math.round(humidity?.value ?? 70),
        lastUpdate: windSpeed.time,
        stationName: station.name,
        stationCode: station.code,
        isFallback,
        isReal: true,
        source: "Meteocat XEMA"
      }

      const prefix = isFallback ? `🔄 FALLBACK ${station.code}` : `✅ ${station.code}`
      console.log(`${prefix} (${station.name}): ${result.windSpeed} kts, ràfega ${result.windGust} kts, dir ${result.windDirection}°`)

      return result
    } catch (error) {
      console.error(`Error a estació ${station.code}:`, error)
    }
  }

  console.error("❌ Cap estació de la cadena Meteocat retorna dades vàlides")
  return null
}

// Obtenir històric del dia actual (per mostrar evolució real)
export async function getMeteocatTodayHistory(): Promise<MeteocatReading[]> {
  console.log(`📊 Obtenint històric real d'avui de Meteocat...`)

  try {
    const today = new Date()
    const dayData = await getDayReadings(today)
    
    if (!dayData || !Array.isArray(dayData) || dayData.length === 0) {
      console.log("No hi ha dades del dia")
      return []
    }

    const stationData = dayData[0]
    if (!stationData.variables) {
      return []
    }

    // Organitzar dades per hora
    const hourlyData: { [time: string]: Partial<MeteocatReading> } = {}

    for (const variable of stationData.variables) {
      const code = variable.codi
      
      for (const lecture of variable.lectures || []) {
        const time = lecture.data
        const lectureDate = new Date(time)
        const hour = lectureDate.getUTCHours() + 2 // UTC a hora local (CEST)
        
        // Només hores de navegació (9:00 - 21:00)
        if (hour < 9 || hour > 21) continue
        
        const hourKey = `${String(hour).padStart(2, '0')}:00`
        
        if (!hourlyData[hourKey]) {
          hourlyData[hourKey] = {
            time: hourKey,
            isReal: true,
            source: "Meteocat XEMA"
          }
        }

        switch (code) {
          case VARIABLE_CODES.WIND_SPEED_10M:
            hourlyData[hourKey].windSpeed = msToKnots(lecture.valor)
            break
          case VARIABLE_CODES.WIND_DIRECTION_10M:
            hourlyData[hourKey].windDirection = Math.round(lecture.valor)
            break
          case VARIABLE_CODES.WIND_GUST_10M:
            hourlyData[hourKey].windGust = msToKnots(lecture.valor)
            break
          case VARIABLE_CODES.TEMPERATURE:
            hourlyData[hourKey].temperature = Math.round(lecture.valor)
            break
          case VARIABLE_CODES.HUMIDITY:
            hourlyData[hourKey].humidity = Math.round(lecture.valor)
            break
        }
      }
    }

    // Convertir a array i completar dades faltants
    const readings = Object.values(hourlyData)
      .filter(r => r.windSpeed !== undefined)
      .map(r => ({
        time: r.time!,
        windSpeed: r.windSpeed!,
        windDirection: r.windDirection ?? 0,
        windGust: Math.max(r.windGust ?? Math.round(r.windSpeed! * 1.3), r.windSpeed!),
        temperature: r.temperature ?? 20,
        humidity: r.humidity ?? 70,
        isReal: true as const,
        source: "Meteocat XEMA" as const
      }))
      .sort((a, b) => a.time.localeCompare(b.time))

    console.log(`✅ Obtingudes ${readings.length} lectures reals d'avui`)
    
    return readings
  } catch (error) {
    console.error("Error obtenint històric Meteocat:", error)
    return []
  }
}

// Funció legacy per compatibilitat (retorna array buit - usar getMeteocatCurrentConditions)
export async function getMeteocatForecast(): Promise<any[]> {
  console.log("⚠️ getMeteocatForecast() és legacy - usant getMeteocatCurrentConditions()")
  return []
}

// Classe legacy per compatibilitat
export class MeteocatProvider {
  name = "Meteocat XEMA"
  priority = 1

  async getCurrentWeather() {
    return getMeteocatCurrentConditions()
  }

  async isAvailable(): Promise<boolean> {
    // Retornar false directament si no hi ha clau API configurada
    // Això evita fer crides innecessàries a l'API
    const apiKey = process.env.METEOCAT_API_KEY
    if (!apiKey) {
      return false
    }
    
    // Només verificar disponibilitat si tenim clau
    try {
      const url = `${METEOCAT_BASE}/variables/mesurades/${VARIABLE_CODES.WIND_SPEED_10M}/ultimes?codiEstacio=${STATION_CODE}`
      const response = await fetch(url, { headers: getHeaders() })
      return response.ok
    } catch {
      return false
    }
  }
}
