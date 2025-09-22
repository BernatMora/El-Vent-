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
      
      // 6. Si falla, retornar error per mostrar estat offline
      console.log(`🔄 Using fallback data for ${spot} due to connection issues`)
      return this.getFallbackData(spot)
    }
  }

  // Dades de fallback clarament marcades
  private getFallbackData(spot: string) {
    console.log("🔄 Generating fallback data...")
    const now = new Date()
    const days = []

    for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
      const date = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000)
      const dateString = date.toISOString().split("T")[0]
      const hours = []

      for (let hour = 9; hour <= 21; hour++) {
        // Patró realista basat en Sant Pere Pescador
        let baseWindSpeed = 2 + Math.sin(((hour - 11) / 6) * Math.PI) * 6
        baseWindSpeed += (Math.random() - 0.5) * 2
        
        // Direcció típica de la zona
        let direction = 90 + (hour - 12) * 5 + (Math.random() - 0.5) * 30
        direction = Math.max(60, Math.min(120, direction))
        
        hours.push({
          time: `${hour.toString().padStart(2, "0")}:00`,
          windSpeed: Math.max(1, Math.round(baseWindSpeed)),
          windDirection: Math.round(direction),
          windGust: Math.round(baseWindSpeed * 1.3),
          temperature: Math.round(20 + (hour - 12) * 0.8 + dayOffset * 0.5),
          humidity: Math.round(65 + Math.random() * 20),
          precipitationProbability: Math.round(Math.random() * 30), // Màxim 30%
          precipitation: 0,
          precipitationType: 'none',
          source: "Dades de referència",
          confidence: 0.3,
          isMLEnhanced: false,
          isCalibrated: false,
          isFallback: true // MARCAR CLARAMENT
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