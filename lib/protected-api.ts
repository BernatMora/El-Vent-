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
      throw new Error('No hi ha connexió disponible')
    }
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