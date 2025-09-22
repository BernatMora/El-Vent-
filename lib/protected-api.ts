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

    // Patrons realistes basats en l'spot
    const spotPatterns = {
      'kitesurf-point': { baseWind: 12, variation: 4, peakHour: 14 },
      'la-ballena': { baseWind: 14, variation: 5, peakHour: 15 },
      'can-martinet': { baseWind: 16, variation: 6, peakHour: 16 },
      'la-rubina': { baseWind: 13, variation: 4, peakHour: 15 }
    }

    const pattern = spotPatterns[spot as keyof typeof spotPatterns] || spotPatterns['la-ballena']

    for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
      const date = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000)
      const dateString = date.toISOString().split("T")[0]
      const hours = []

      for (let hour = 9; hour <= 21; hour++) {
        // Patró realista de vent
        const hourFactor = Math.sin(((hour - 6) / 12) * Math.PI) * 0.7 + 0.3
        const peakBonus = hour === pattern.peakHour ? 1.2 : 1.0
        const dayDecay = dayOffset === 0 ? 1.0 : dayOffset === 1 ? 0.9 : 0.8
        const randomFactor = 0.8 + Math.random() * 0.4

        let windSpeed = pattern.baseWind * hourFactor * peakBonus * dayDecay * randomFactor
        windSpeed = Math.max(2, Math.min(25, windSpeed))

        // Direcció realista (predominantment E-SE per la Costa Brava)
        const baseDirection = 90 + (Math.random() - 0.5) * 60 // E ± 30°
        const windDirection = Math.max(45, Math.min(135, baseDirection))

        hours.push({
          time: `${hour.toString().padStart(2, "0")}:00`,
          windSpeed: Math.round(windSpeed),
          windDirection: Math.round(windDirection),
          windGust: Math.round(windSpeed * (1.2 + Math.random() * 0.3)),
          temperature: Math.round(18 + (hour - 9) * 0.8 + dayOffset * 1.5),
          humidity: Math.round(65 + Math.random() * 20),
          source: "Dades simulades intel·ligents",
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