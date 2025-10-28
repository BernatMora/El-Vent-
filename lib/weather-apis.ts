// Sistema multi-API per obtenir dades meteorològiques de múltiples fonts
import { MeteocatProvider } from './meteocat-api'

export interface WeatherData {
  timestamp: string
  windSpeed: number
  windDirection: number
  windGust: number
  temperature: number
  humidity: number
  pressure?: number
  precipitation?: number
  source: string
  confidence: number
}

export interface WeatherProvider {
  name: string
  getWeatherData(lat: number, lon: number): Promise<WeatherData[]>
  isAvailable(): Promise<boolean>
  priority: number
}

// Open-Meteo API (gratuïta)
export class OpenMeteoProvider implements WeatherProvider {
  name = "Open-Meteo"
  priority = 0 // Prioritat màxima

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch("https://api.open-meteo.com/v1/forecast?latitude=42.18&longitude=3.08&hourly=temperature_2m&forecast_days=1")
      return response.ok
    } catch {
      return false
    }
  }

  async getWeatherData(lat: number, lon: number): Promise<WeatherData[]> {
    const url = `https://api.open-meteo.com/v1/forecast?` +
      `latitude=${lat}&longitude=${lon}&` +
      `hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,surface_pressure&` +
      `wind_speed_unit=kn&timezone=Europe/Madrid&forecast_days=3`

    const response = await fetch(url)
    if (!response.ok) throw new Error(`Open-Meteo error: ${response.status}`)
    
    const data = await response.json()
    return this.processData(data)
  }

  private processData(data: any): WeatherData[] {
    const { time, temperature_2m, relative_humidity_2m, wind_speed_10m, wind_direction_10m, wind_gusts_10m, surface_pressure } = data.hourly
    
    return time.map((timestamp: string, index: number) => ({
      timestamp,
      windSpeed: wind_speed_10m[index] || 0,
      windDirection: wind_direction_10m[index] || 0,
      windGust: wind_gusts_10m[index] || wind_speed_10m[index] * 1.3,
      temperature: temperature_2m[index] || 20,
      humidity: relative_humidity_2m[index] || 70,
      pressure: surface_pressure[index],
      source: this.name,
      confidence: 0.8
    }))
  }
}

// WeatherAPI (freemium)
export class WeatherAPIProvider implements WeatherProvider {
  name = "WeatherAPI"
  priority = 2
  private apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false
    try {
      const response = await fetch(`https://api.weatherapi.com/v1/current.json?key=${this.apiKey}&q=42.18,3.08`)
      return response.ok
    } catch {
      return false
    }
  }

  async getWeatherData(lat: number, lon: number): Promise<WeatherData[]> {
    if (!this.apiKey) throw new Error("WeatherAPI key not configured")
    
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${this.apiKey}&q=${lat},${lon}&days=3&aqi=no&alerts=no`
    
    const response = await fetch(url)
    if (!response.ok) throw new Error(`WeatherAPI error: ${response.status}`)
    
    const data = await response.json()
    return this.processData(data)
  }

  private processData(data: any): WeatherData[] {
    const results: WeatherData[] = []
    
    data.forecast.forecastday.forEach((day: any) => {
      day.hour.forEach((hour: any) => {
        results.push({
          timestamp: hour.time,
          windSpeed: Math.round(hour.wind_kph / 1.852), // Convert km/h to knots
          windDirection: hour.wind_degree,
          windGust: Math.round(hour.gust_kph / 1.852),
          temperature: hour.temp_c,
          humidity: hour.humidity,
          pressure: hour.pressure_mb,
          source: this.name,
          confidence: 0.85
        })
      })
    })
    
    return results
  }
}

// OpenWeatherMap (freemium)
export class OpenWeatherMapProvider implements WeatherProvider {
  name = "OpenWeatherMap"
  priority = 3
  private apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false
    try {
      const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=42.18&lon=3.08&appid=${this.apiKey}`)
      return response.ok
    } catch {
      return false
    }
  }

  async getWeatherData(lat: number, lon: number): Promise<WeatherData[]> {
    if (!this.apiKey) throw new Error("OpenWeatherMap key not configured")

    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`

    const response = await fetch(url)
    if (!response.ok) throw new Error(`OpenWeatherMap error: ${response.status}`)

    const data = await response.json()
    return this.processData(data)
  }

  private processData(data: any): WeatherData[] {
    return data.list.map((item: any) => ({
      timestamp: new Date(item.dt * 1000).toISOString(),
      windSpeed: Math.round(item.wind.speed * 1.944), // Convert m/s to knots
      windDirection: item.wind.deg,
      windGust: Math.round((item.wind.gust || item.wind.speed * 1.3) * 1.944),
      temperature: item.main.temp,
      humidity: item.main.humidity,
      pressure: item.main.pressure,
      precipitation: item.rain?.['3h'] || 0,
      source: this.name,
      confidence: 0.75
    }))
  }
}

// Meteocat (Servei Meteorològic de Catalunya) - Dades oficials
export class MeteocatWeatherProvider implements WeatherProvider {
  name = "Meteocat"
  priority = 1 // Font de suport
  private meteocatProvider = new MeteocatProvider()

  async isAvailable(): Promise<boolean> {
    return await this.meteocatProvider.isAvailable()
  }

  async getWeatherData(lat: number, lon: number): Promise<WeatherData[]> {
    const forecast = await this.meteocatProvider.getForecast()

    return forecast.map((item) => ({
      timestamp: item.timestamp,
      windSpeed: item.windSpeed,
      windDirection: item.windDirection,
      windGust: item.windGust,
      temperature: item.temperature,
      humidity: item.humidity || 70,
      precipitation: item.precipitation,
      source: item.source,
      confidence: item.confidence
    }))
  }
}

// Gestor principal de múltiples APIs
export class MultiWeatherService {
  private providers: WeatherProvider[] = [
    new OpenMeteoProvider(), // Prioritat màxima
    new MeteocatWeatherProvider(), // Font de suport
    new WeatherAPIProvider(),
    new OpenWeatherMapProvider()
  ]

  async getAggregatedWeatherData(lat: number, lon: number): Promise<WeatherData[]> {
    const allData: WeatherData[] = []
    const availableProviders: WeatherProvider[] = []

    // Comprovar quins proveïdors estan disponibles
    for (const provider of this.providers) {
      try {
        if (await provider.isAvailable()) {
          availableProviders.push(provider)
        }
      } catch (error) {
        console.warn(`Provider ${provider.name} not available:`, error)
      }
    }

    // Obtenir dades de tots els proveïdors disponibles
    const promises = availableProviders.map(async (provider) => {
      try {
        const data = await provider.getWeatherData(lat, lon)
        return data
      } catch (error) {
        console.error(`Error fetching from ${provider.name}:`, error)
        return []
      }
    })

    const results = await Promise.allSettled(promises)
    
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        allData.push(...result.value)
      }
    })

    // Agregar i combinar dades
    return this.aggregateData(allData)
  }

  private aggregateData(allData: WeatherData[]): WeatherData[] {
    // Agrupar per timestamp (hora)
    const groupedData = new Map<string, WeatherData[]>()
    
    allData.forEach(data => {
      const hourKey = data.timestamp.substring(0, 13) // YYYY-MM-DDTHH
      if (!groupedData.has(hourKey)) {
        groupedData.set(hourKey, [])
      }
      groupedData.get(hourKey)!.push(data)
    })

    // Combinar dades de cada hora
    const aggregatedData: WeatherData[] = []
    
    groupedData.forEach((dataPoints, hourKey) => {
      if (dataPoints.length === 0) return

      // Calcular mitjanes ponderades per confiança
      const totalConfidence = dataPoints.reduce((sum, d) => sum + d.confidence, 0)
      
      const aggregated: WeatherData = {
        timestamp: hourKey + ':00:00.000Z',
        windSpeed: this.weightedAverage(dataPoints, 'windSpeed', totalConfidence),
        windDirection: this.averageDirection(dataPoints, totalConfidence),
        windGust: this.weightedAverage(dataPoints, 'windGust', totalConfidence),
        temperature: this.weightedAverage(dataPoints, 'temperature', totalConfidence),
        humidity: this.weightedAverage(dataPoints, 'humidity', totalConfidence),
        pressure: this.weightedAverage(dataPoints, 'pressure', totalConfidence),
        source: `Agregat (${dataPoints.map(d => d.source).join(', ')})`,
        confidence: Math.min(0.95, totalConfidence / dataPoints.length + 0.1) // Bonus per múltiples fonts
      }
      
      aggregatedData.push(aggregated)
    })

    return aggregatedData.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  }

  private weightedAverage(dataPoints: WeatherData[], field: keyof WeatherData, totalConfidence: number): number {
    const sum = dataPoints.reduce((acc, data) => {
      const value = data[field] as number
      return acc + (value || 0) * data.confidence
    }, 0)
    
    return Math.round((sum / totalConfidence) * 10) / 10
  }

  private averageDirection(dataPoints: WeatherData[], totalConfidence: number): number {
    // Convertir angles a vectors per calcular mitjana correctament
    let x = 0, y = 0
    
    dataPoints.forEach(data => {
      const radians = (data.windDirection * Math.PI) / 180
      const weight = data.confidence / totalConfidence
      x += Math.cos(radians) * weight
      y += Math.sin(radians) * weight
    })
    
    let avgDirection = (Math.atan2(y, x) * 180) / Math.PI
    if (avgDirection < 0) avgDirection += 360
    
    return Math.round(avgDirection)
  }
}