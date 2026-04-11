// Sistema per guardar prediccions i comparar-les amb les condicions reals

const STORAGE_KEY = "el-vent-prediction-history"
const MAX_HISTORY_DAYS = 30

export interface PredictionRecord {
  date: string // YYYY-MM-DD
  hour: string // HH:00
  spot: string
  predicted: {
    windSpeed: number
    windDirection: number
    windGust: number
  }
  actual?: {
    windSpeed: number
    windDirection: number
    windGust: number
    reportedAt: string
  }
  accuracy?: {
    windSpeedError: number // diferencia en kn
    windDirectionError: number // diferencia en graus
    overallScore: number // 0-100
  }
}

export interface AccuracyStats {
  totalPredictions: number
  verifiedPredictions: number
  averageWindSpeedError: number
  averageDirectionError: number
  overallAccuracy: number
  last7Days: {
    date: string
    accuracy: number
    predictions: number
  }[]
}

class PredictionHistoryService {
  private history: PredictionRecord[] = []

  constructor() {
    this.loadFromStorage()
  }

  private loadFromStorage() {
    if (typeof window === "undefined") return
    
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        this.history = JSON.parse(saved)
        // Netejar registres antics
        this.cleanOldRecords()
      }
    } catch {
      this.history = []
    }
  }

  private saveToStorage() {
    if (typeof window === "undefined") return
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.history))
    } catch {
      // Storage full, netejar
      this.cleanOldRecords()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.history))
    }
  }

  private cleanOldRecords() {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - MAX_HISTORY_DAYS)
    const cutoffStr = cutoffDate.toISOString().split("T")[0]
    
    this.history = this.history.filter(r => r.date >= cutoffStr)
  }

  // Guardar una predicció
  savePrediction(spot: string, date: string, hour: string, predicted: PredictionRecord["predicted"]) {
    const existingIndex = this.history.findIndex(
      r => r.spot === spot && r.date === date && r.hour === hour
    )

    const record: PredictionRecord = {
      date,
      hour,
      spot,
      predicted
    }

    if (existingIndex >= 0) {
      // Actualitzar predicció existent si no té dades reals
      if (!this.history[existingIndex].actual) {
        this.history[existingIndex].predicted = predicted
      }
    } else {
      this.history.push(record)
    }

    this.saveToStorage()
  }

  // Registrar condicions reals (quan l'usuari les reporta)
  reportActualConditions(
    spot: string, 
    windSpeed: number, 
    windDirection: number, 
    windGust: number
  ) {
    const now = new Date()
    const date = now.toISOString().split("T")[0]
    const hour = `${now.getHours().toString().padStart(2, "0")}:00`

    // Buscar predicció per aquesta hora
    const record = this.history.find(
      r => r.spot === spot && r.date === date && r.hour === hour
    )

    if (record) {
      record.actual = {
        windSpeed,
        windDirection,
        windGust,
        reportedAt: now.toISOString()
      }

      // Calcular precisió
      record.accuracy = this.calculateAccuracy(record.predicted, record.actual)
      this.saveToStorage()
    }

    return record
  }

  private calculateAccuracy(
    predicted: PredictionRecord["predicted"],
    actual: NonNullable<PredictionRecord["actual"]>
  ): PredictionRecord["accuracy"] {
    const windSpeedError = Math.abs(predicted.windSpeed - actual.windSpeed)
    
    // Calcular error de direcció (tenint en compte que 350° i 10° son propers)
    let directionDiff = Math.abs(predicted.windDirection - actual.windDirection)
    if (directionDiff > 180) directionDiff = 360 - directionDiff
    
    // Puntuació general (0-100)
    // Error de 0 kn = 100 punts, error de 10 kn = 0 punts
    const speedScore = Math.max(0, 100 - windSpeedError * 10)
    // Error de 0° = 100 punts, error de 90° = 0 punts
    const directionScore = Math.max(0, 100 - (directionDiff / 90) * 100)
    
    // Mitjana ponderada (velocitat més important)
    const overallScore = Math.round(speedScore * 0.7 + directionScore * 0.3)

    return {
      windSpeedError,
      windDirectionError: directionDiff,
      overallScore
    }
  }

  // Obtenir estadístiques de precisió
  getAccuracyStats(spot?: string): AccuracyStats {
    const filtered = spot 
      ? this.history.filter(r => r.spot === spot)
      : this.history

    const verified = filtered.filter(r => r.accuracy)

    if (verified.length === 0) {
      return {
        totalPredictions: filtered.length,
        verifiedPredictions: 0,
        averageWindSpeedError: 0,
        averageDirectionError: 0,
        overallAccuracy: 0,
        last7Days: []
      }
    }

    const avgSpeedError = verified.reduce((sum, r) => sum + (r.accuracy?.windSpeedError || 0), 0) / verified.length
    const avgDirError = verified.reduce((sum, r) => sum + (r.accuracy?.windDirectionError || 0), 0) / verified.length
    const avgAccuracy = verified.reduce((sum, r) => sum + (r.accuracy?.overallScore || 0), 0) / verified.length

    // Estadístiques dels últims 7 dies
    const last7Days: AccuracyStats["last7Days"] = []
    const today = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]
      
      const dayRecords = verified.filter(r => r.date === dateStr)
      
      if (dayRecords.length > 0) {
        const dayAccuracy = dayRecords.reduce((sum, r) => sum + (r.accuracy?.overallScore || 0), 0) / dayRecords.length
        last7Days.push({
          date: dateStr,
          accuracy: Math.round(dayAccuracy),
          predictions: dayRecords.length
        })
      } else {
        last7Days.push({
          date: dateStr,
          accuracy: 0,
          predictions: 0
        })
      }
    }

    return {
      totalPredictions: filtered.length,
      verifiedPredictions: verified.length,
      averageWindSpeedError: Math.round(avgSpeedError * 10) / 10,
      averageDirectionError: Math.round(avgDirError),
      overallAccuracy: Math.round(avgAccuracy),
      last7Days
    }
  }

  // Obtenir històric recent
  getRecentHistory(spot: string, limit = 10): PredictionRecord[] {
    return this.history
      .filter(r => r.spot === spot && r.accuracy)
      .sort((a, b) => `${b.date}${b.hour}`.localeCompare(`${a.date}${a.hour}`))
      .slice(0, limit)
  }
}

export const predictionHistory = new PredictionHistoryService()
