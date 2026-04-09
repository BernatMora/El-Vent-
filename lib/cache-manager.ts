// Sistema de cache avançat per evitar costos d'API
export interface CacheEntry {
  data: any
  timestamp: number
  expiresAt: number
  source: string
}

export interface CacheStats {
  totalRequests: number
  cacheHits: number
  cacheMisses: number
  lastReset: number
}

class CacheManager {
  private cache = new Map<string, CacheEntry>()
  private stats: CacheStats = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    lastReset: Date.now()
  }
  
  // Configuració de cache (temps en mil·lisegons)
  private readonly CACHE_DURATIONS = {
    weather: 15 * 60 * 1000,      // 15 minuts per dades meteorològiques
    forecast: 30 * 60 * 1000,     // 30 minuts per previsions
    tides: 60 * 60 * 1000,        // 1 hora per marees
    fallback: 5 * 60 * 1000       // 5 minuts per dades de fallback
  }

  // Límits diaris per evitar costos
  private readonly DAILY_LIMITS = {
    maxApiCalls: 100,              // Màxim 100 crides API per dia
    maxCallsPerSpot: 20,           // Màxim 20 crides per spot per dia
    resetHour: 0                   // Reset a mitjanit
  }

  private dailyUsage = new Map<string, number>()

  constructor() {
    this.loadFromStorage()
    this.setupDailyReset()
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      try {
        // Carregar cache
        const cached = localStorage.getItem('weather-cache')
        if (cached) {
          const parsed = JSON.parse(cached)
          Object.entries(parsed).forEach(([key, entry]: [string, any]) => {
            if (entry.expiresAt > Date.now()) {
              this.cache.set(key, entry)
            }
          })
        }

        // Carregar estadístiques
        const stats = localStorage.getItem('cache-stats')
        if (stats) {
          this.stats = JSON.parse(stats)
        }

        // Carregar ús diari
        const usage = localStorage.getItem('daily-usage')
        if (usage) {
          const parsed = JSON.parse(usage)
          const today = new Date().toDateString()
          if (parsed.date === today) {
            this.dailyUsage = new Map(parsed.usage)
          }
        }
      } catch (error) {
        console.error('Error carregant cache:', error)
      }
    }
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      try {
        // Guardar cache (només entrades no expirades)
        const cacheObj: any = {}
        this.cache.forEach((entry, key) => {
          if (entry.expiresAt > Date.now()) {
            cacheObj[key] = entry
          }
        })
        localStorage.setItem('weather-cache', JSON.stringify(cacheObj))

        // Guardar estadístiques
        localStorage.setItem('cache-stats', JSON.stringify(this.stats))

        // Guardar ús diari
        const today = new Date().toDateString()
        const usageData = {
          date: today,
          usage: Array.from(this.dailyUsage.entries())
        }
        localStorage.setItem('daily-usage', JSON.stringify(usageData))
      } catch (error) {
        console.error('Error desant cache:', error)
      }
    }
  }

  private setupDailyReset() {
    // Reset automàtic cada dia a mitjanit
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime()
    
    setTimeout(() => {
      this.resetDailyUsage()
      // Configurar reset diari
      setInterval(() => this.resetDailyUsage(), 24 * 60 * 60 * 1000)
    }, msUntilMidnight)
  }

  private resetDailyUsage() {
    this.dailyUsage.clear()
    this.stats.lastReset = Date.now()
    this.saveToStorage()
    console.log('Daily API usage reset')
  }

  // Comprovar si podem fer una crida API
  canMakeApiCall(spot: string): boolean {
    const totalCalls = Array.from(this.dailyUsage.values()).reduce((sum, count) => sum + count, 0)
    const spotCalls = this.dailyUsage.get(spot) || 0

    return totalCalls < this.DAILY_LIMITS.maxApiCalls && 
           spotCalls < this.DAILY_LIMITS.maxCallsPerSpot
  }

  // Registrar una crida API
  recordApiCall(spot: string) {
    const current = this.dailyUsage.get(spot) || 0
    this.dailyUsage.set(spot, current + 1)
    this.saveToStorage()
  }

  // Obtenir dades del cache
  get(key: string, type: keyof typeof this.CACHE_DURATIONS = 'weather'): CacheEntry | null {
    this.stats.totalRequests++
    
    const entry = this.cache.get(key)
    if (entry && entry.expiresAt > Date.now()) {
      this.stats.cacheHits++
      console.log(`Cache HIT for ${key} (${entry.source})`)
      return entry
    }

    this.stats.cacheMisses++
    console.log(`Cache MISS for ${key}`)
    return null
  }

  // Guardar dades al cache
  set(key: string, data: any, type: keyof typeof this.CACHE_DURATIONS = 'weather', source: string = 'unknown') {
    const duration = this.CACHE_DURATIONS[type]
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + duration,
      source
    }

    this.cache.set(key, entry)
    this.saveToStorage()
    console.log(`Cached ${key} for ${duration/1000/60} minutes (${source})`)
  }

  // Netejar cache expirat
  cleanup() {
    const before = this.cache.size
    this.cache.forEach((entry, key) => {
      if (entry.expiresAt <= Date.now()) {
        this.cache.delete(key)
      }
    })
    const after = this.cache.size
    if (before !== after) {
      console.log(`Cache cleanup: removed ${before - after} expired entries`)
      this.saveToStorage()
    }
  }

  // Obtenir estadístiques
  getStats() {
    const totalCalls = Array.from(this.dailyUsage.values()).reduce((sum, count) => sum + count, 0)
    const hitRate = this.stats.totalRequests > 0 ? 
      Math.round((this.stats.cacheHits / this.stats.totalRequests) * 100) : 0

    return {
      ...this.stats,
      hitRate,
      cacheSize: this.cache.size,
      dailyApiCalls: totalCalls,
      remainingCalls: this.DAILY_LIMITS.maxApiCalls - totalCalls,
      isNearLimit: totalCalls > this.DAILY_LIMITS.maxApiCalls * 0.8
    }
  }

  // Forçar mode offline
  isOfflineMode(): boolean {
    const totalCalls = Array.from(this.dailyUsage.values()).reduce((sum, count) => sum + count, 0)
    return totalCalls >= this.DAILY_LIMITS.maxApiCalls
  }
}

export const cacheManager = new CacheManager()

// Netejar cache cada 10 minuts
if (typeof window !== 'undefined') {
  setInterval(() => cacheManager.cleanup(), 10 * 60 * 1000)
}