// Integració amb l'API de Meteocat (Servei Meteorològic de Catalunya)
// API pública: https://apidocs.meteocat.gencat.cat/

const METEOCAT_BASE = "https://api.meteo.cat"

// Estació meteorològica més propera a Sant Pere Pescador
// Utilitzarem l'estació de Roses (CG) - Codi: CG
const METEOCAT_STATION = "CG" // Roses, la més propera a Sant Pere Pescador

// Coordenades de Sant Pere Pescador per buscar estacions properes
const SANT_PERE_COORDS = {
  lat: 42.1833,
  lon: 3.0833,
}

function getMeteocatHeaders(): HeadersInit {
  const headers: HeadersInit = { 'Accept': 'application/json' }
  const apiKey = typeof window !== "undefined"
    ? undefined
    : process.env.METEOCAT_API_KEY
  if (apiKey) {
    headers['x-api-key'] = apiKey
  }
  return headers
}

export interface MeteocatWeatherData {
  timestamp: string
  windSpeed: number
  windDirection: number
  windGust: number
  temperature: number
  humidity?: number
  precipitation: number
  source: string
  confidence: number
}

export class MeteocatProvider {
  name = "Meteocat"
  priority = 1 // Alta prioritat per ser dades locals de Catalunya

  // Obtenir dades meteorològiques actuals
  async getCurrentWeather(): Promise<MeteocatWeatherData | null> {
    try {
      console.log("🌐 Obtenint dades actuals de Meteocat...")

      // API de Meteocat per observacions actuals
      const url = `${METEOCAT_BASE}/xema/v1/estacions/${METEOCAT_STATION}/variables/mesurades?estat=ope`

      const response = await fetch(url, {
        headers: getMeteocatHeaders(),
      })

      if (!response.ok) {
        throw new Error(`Error HTTP de Meteocat: ${response.status}`)
      }

      const data = await response.json()
      console.log("📊 Dades rebudes de Meteocat:", data)

      return this.processCurrentData(data)
    } catch (error) {
      console.error("❌ Error obtenint dades de Meteocat:", error)
      return null
    }
  }

  // Obtenir predicció meteorològica
  async getForecast(): Promise<MeteocatWeatherData[]> {
    try {
      console.log("🌐 Obtenint predicció de Meteocat...")

      // Per Sant Pere Pescador, utilitzarem el municipi 170138
      // Alt Empordà - Sant Pere Pescador
      const municipiCode = "170138"

      const url = `${METEOCAT_BASE}/prediccio/v1/municipal/${municipiCode}`

      const response = await fetch(url, {
        headers: getMeteocatHeaders(),
      })

      if (!response.ok) {
        console.warn(`⚠️ Error HTTP de Meteocat predicció: ${response.status}`)
        // Retornar array buit si falla
        return []
      }

      const data = await response.json()
      console.log("📊 Predicció rebuda de Meteocat")

      return this.processForecastData(data)
    } catch (error) {
      console.error("❌ Error obtenint predicció de Meteocat:", error)
      return []
    }
  }

  // Processar dades actuals
  private processCurrentData(data: any): MeteocatWeatherData | null {
    try {
      const now = new Date().toISOString()

      // Buscar variables meteorològiques
      const variables = data.variables || []

      let temperature = 20
      let windSpeed = 0
      let windDirection = 0
      let windGust = 0
      let humidity = 70
      let precipitation = 0

      variables.forEach((variable: any) => {
        const codi = variable.codi
        const lectures = variable.lectures || []

        if (lectures.length > 0) {
          const ultimaLectura = lectures[lectures.length - 1]
          const valor = ultimaLectura.valor

          switch (codi) {
            case 32: // Temperatura
              temperature = parseFloat(valor) || 20
              break
            case 30: // Humitat relativa
              humidity = parseFloat(valor) || 70
              break
            case 35: // Velocitat del vent (m/s)
              windSpeed = Math.round((parseFloat(valor) || 0) * 1.944) // Convertir m/s a nusos
              break
            case 36: // Direcció del vent
              windDirection = Math.round(parseFloat(valor) || 0)
              break
            case 81: // Ratxa màxima de vent
              windGust = Math.round((parseFloat(valor) || 0) * 1.944)
              break
            case 6: // Precipitació acumulada
              precipitation = parseFloat(valor) || 0
              break
          }
        }
      })

      // Si no hi ha ratxa, estimar-la. Sempre assegurar que windGust >= windSpeed
      if (windGust === 0 && windSpeed > 0) {
        windGust = Math.round(windSpeed * 1.4)
      }
      // Assegurar que les ràfegues sempre siguin >= al vent sostingut
      windGust = Math.max(windGust, windSpeed)

      return {
        timestamp: now,
        temperature,
        windSpeed,
        windDirection,
        windGust,
        humidity,
        precipitation,
        source: "Meteocat (Oficial)",
        confidence: 0.95 // Alta confiança per ser dades oficials
      }
    } catch (error) {
      console.error("❌ Error processant dades actuals de Meteocat:", error)
      return null
    }
  }

  // Processar dades de predicció
  private processForecastData(data: any): MeteocatWeatherData[] {
    const results: MeteocatWeatherData[] = []

    try {
      const dies = data.dies || []

      dies.slice(0, 7).forEach((dia: any) => {
        const data_prediccio = dia.data_prediccio
        const variables = dia.variables || {}

        // Obtenir temperatures
        const temp_min = variables.temperatura?.min || 15
        const temp_max = variables.temperatura?.max || 25

        // Obtenir vent
        const vent = variables.vent || {}
        const velocitat_vent = vent.velocitat || 0 // km/h
        const direccio_vent = vent.direccio || 0

        // Obtenir precipitació
        const precipitacio = variables.precipitacio?.suma || 0

        // Generar dades horàries simulades per al dia (9:00 - 21:00)
        for (let hour = 9; hour <= 21; hour++) {
          // Interpolar temperatura segons l'hora
          let temperature = temp_min
          if (hour >= 8 && hour <= 16) {
            const progress = (hour - 8) / 8
            temperature = temp_min + (temp_max - temp_min) * Math.sin(progress * Math.PI)
          } else if (hour > 16) {
            const progress = (hour - 16) / 8
            temperature = temp_max - (temp_max - temp_min) * progress
          }

          // Convertir velocitat de vent de km/h a nusos
          const windSpeedKnots = Math.round((velocitat_vent / 1.852))
          // Assegurar que les ràfegues sempre siguin >= al vent sostingut
          const windGust = Math.round(Math.max(windSpeedKnots * 1.4, windSpeedKnots))

          results.push({
            timestamp: `${data_prediccio}T${hour.toString().padStart(2, '0')}:00:00.000Z`,
            temperature: Math.round(temperature),
            windSpeed: windSpeedKnots,
            windDirection: direccio_vent,
            windGust,
            humidity: 70, // Valor estimat
            precipitation: precipitacio / 13, // Distribuir precipitació entre les hores
            source: "Meteocat (Predicció)",
            confidence: 0.85
          })
        }
      })

      console.log("📈 Dades de predicció processades:", results.length, "hores")
    } catch (error) {
      console.error("❌ Error processant predicció de Meteocat:", error)
    }

    return results
  }

  // Comprovar si l'API està disponible
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${METEOCAT_BASE}/xema/v1/estacions/${METEOCAT_STATION}`, {
        headers: getMeteocatHeaders(),
      })
      return response.ok
    } catch {
      return false
    }
  }
}

// Funció auxiliar per obtenir dades de Meteocat
export async function getMeteocatForecast(): Promise<any[]> {
  const provider = new MeteocatProvider()

  try {
    // Comprovar disponibilitat
    const available = await provider.isAvailable()
    if (!available) {
      console.warn("⚠️ API de Meteocat no disponible")
      return []
    }

    // Obtenir predicció
    const forecast = await provider.getForecast()

    if (forecast.length === 0) {
      console.warn("⚠️ No s'han pogut obtenir dades de predicció de Meteocat")
      return []
    }

    // Agrupar per dies
    const dayGroups: { [key: string]: any[] } = {}

    forecast.forEach((data) => {
      const date = new Date(data.timestamp)
      const hour = date.getHours()

      // Només incloure hores de navegació (9:00 - 21:00)
      if (hour >= 9 && hour <= 21) {
        const dateKey = data.timestamp.split('T')[0]

        if (!dayGroups[dateKey]) {
          dayGroups[dateKey] = []
        }

        dayGroups[dateKey].push({
          time: `${hour.toString().padStart(2, '0')}:00`,
          windSpeed: data.windSpeed,
          windDirection: data.windDirection,
          windGust: data.windGust,
          temperature: data.temperature,
          humidity: data.humidity || 70,
          precipitation: Math.round(data.precipitation * 10) / 10,
          source: data.source,
          confidence: data.confidence,
          isReal: false
        })
      }
    })

    // Convertir a format esperat
    const result = Object.entries(dayGroups)
      .slice(0, 7)
      .map(([date, hours]) => ({
        date,
        hours: hours.sort((a, b) => a.time.localeCompare(b.time))
      }))

    console.log("✅ Dades de Meteocat processades:", result.length, "dies")
    return result
  } catch (error) {
    console.error("❌ Error en getMeteocatForecast:", error)
    return []
  }
}
