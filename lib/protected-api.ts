// API protegida amb cache agressiu i límits estrictes
import { cacheManager } from './cache-manager'
import { enhancedWeatherService } from './enhanced-api'

export class ProtectedWeatherAPI {
  private readonly FALLBACK_DATA_DURATION = 24 * 60 * 60 * 1000 // 24 hores

  async getForecastData(spot: string) {
    console.log(`🛡️ Protected API call for spot: ${spot}`)
    
    // 1. Intentar obtenir del cache primer
    const cacheKey = `forecast-${spot}`
    const cached = cacheManager.get(cacheKey, 'forecast')
    
    if (cached) {
      console.log(`✅ Serving cached data for ${spot}`)
      return cached.data
    }

    // 2. Comprovar si podem fer crides API
    if (!cacheManager.canMakeApiCall(spot)) {
      console.log(`⚠️ API limit reached for ${spot}, using fallback`)
      return this.getFallbackData(spot)
    }

    // 3. Comprovar si estem en mode offline forçat
    if (cacheManager.isOfflineMode()) {
      console.log(`📴 Offline mode active, using fallback`)
      return this.getFallbackData(spot)
    }

    try {
      // 4. Intentar obtenir dades reals
      console.log(`🌐 Making API call for ${spot}`)
      cacheManager.recordApiCall(spot)
      
      const data = await enhancedWeatherService.getEnhancedForecast(spot)
      
      // 5. Guardar al cache amb durada llarga
      cacheManager.set(cacheKey, data, 'forecast', 'Enhanced API')
      
      console.log(`✅ Fresh data obtained and cached for ${spot}`)
      return data

    } catch (error) {
      console.error(`❌ API call failed for ${spot}:`, error)
      
      // 6. Si falla, usar dades de fallback
      return this.getFallbackData(spot)
    }
  }

  private getFallbackData(spot: string) {
    // Comprovar si tenim dades de fallback cached
    const fallbackKey = `fallback-${spot}`
    const cached = cacheManager.get(fallbackKey, 'fallback')
    
    if (cached) {
      console.log(`📦 Using cached fallback data for ${spot}`)
      return cached.data
    }

    // Generar noves dades de fallback
    console.log(`🎲 Generating new fallback data for ${spot}`)
    const fallbackData = this.generateSmartFallback(spot)
    
    // Cache les dades de fallback per 5 minuts
    cacheManager.set(fallbackKey, fallbackData, 'fallback', 'Smart Fallback')
    
    return fallbackData
  }

  private generateSmartFallback(spot: string) {
    const now = new Date()
    const days = []

    for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
      const date = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000)
      const dateString = date.toISOString().split("T")[0]
      const hours = []

      for (let hour = 9; hour <= 21; hour++) {
        let baseWindSpeed = 2

        if (hour >= 11 && hour <= 17) {
          baseWindSpeed = 6 + Math.sin(((hour - 11) / 6) * Math.PI) * 6
        } else if (hour >= 9 && hour < 11) {
          baseWindSpeed = 2 + (hour - 9) * 2
        } else if (hour > 17 && hour <= 19) {
          baseWindSpeed = 8 - (hour - 17) * 2
        } else {
          baseWindSpeed = 1 + Math.random() * 2
        }

        const dayTrend = dayOffset === 0 ? 1.0 : dayOffset === 1 ? 1.1 : 0.9
        baseWindSpeed *= dayTrend
        baseWindSpeed += (Math.random() - 0.5) * 2

        let windDirection = 90
        if (hour < 12) {
          windDirection = 60 + Math.random() * 30
        } else if (hour >= 12 && hour <= 16) {
          windDirection = 80 + Math.random() * 20
        } else {
          windDirection = 100 + Math.random() * 35
        }

        let temperature = 14 + (hour - 9) * 0.7
        if (hour > 15) {
          temperature = 19 - (hour - 15) * 0.3
        }
        temperature += dayOffset * 0.5
        temperature += (Math.random() - 0.5) * 1.5

        const humidity = Math.max(50, Math.min(95, 85 - (temperature - 15) * 2 + Math.random() * 10))

        hours.push({
          time: `${hour.toString().padStart(2, "0")}:00`,
          windSpeed: Math.max(1, Math.round(baseWindSpeed)),
          windDirection: Math.round(windDirection),
          windGust: Math.round(baseWindSpeed * (1.3 + Math.random() * 0.4)),
          temperature: Math.round(temperature),
          humidity: Math.round(humidity),
          precipitation: Math.random() < 0.2 ? Math.round(Math.random() * 2 * 10) / 10 : 0,
          precipitationProbability: Math.round(Math.random() * 70),
          precipitationType: Math.random() < 0.15 ? (
            Math.random() < 0.3 ? 'thunderstorm' : 
            Math.random() < 0.6 ? 'rain' : 'drizzle'
          ) : 'none',
          cloudCover: Math.round(20 + Math.random() * 60),
          isCalibrated: false,
          source: "Simulat"
        })
      }

      days.push({
        date: dateString,
        hours: hours,
      })
    }

    return days
  }

          confidence: 0.4,
          isMLEnhanced: false,
          isCalibrated: false,
          isFallback: true
        })
      }

      days.push({ date: dateString, hours })
    }

    return days
  }

  // Obtenir estadístiques de protecció
  getProtectionStats() {
    const stats = cacheManager.getStats()
    return {
      ...stats,
      isProtected: true,
      offlineMode: cacheManager.isOfflineMode(),
      costSavings: `${stats.cacheHits} crides evitades`,
      status: stats.isNearLimit ? 'Prop del límit' : 
              cacheManager.isOfflineMode() ? 'Mode offline' : 'Operatiu'
    }
  }
}

export const protectedWeatherAPI = new ProtectedWeatherAPI()