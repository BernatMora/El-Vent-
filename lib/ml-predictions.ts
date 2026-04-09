// Sistema de Machine Learning per millorar prediccions meteorològiques
export interface MLTrainingData {
  // Dades d'entrada (features)
  modelWindSpeed: number
  modelWindDirection: number
  modelTemperature: number
  modelHumidity: number
  modelPressure: number
  timeOfDay: number // 0-23
  dayOfYear: number // 1-365
  spot: string
  
  // Dades reals observades (targets)
  actualWindSpeed: number
  actualWindDirection: number
  
  // Metadades
  timestamp: Date
  confidence: number
}

export interface MLPrediction {
  windSpeed: number
  windDirection: number
  confidence: number
  adjustmentFactor: number
}

export class WeatherMLService {
  private trainingData: MLTrainingData[] = []
  private models: Map<string, any> = new Map()
  private isInitialized = false

  constructor() {
    this.loadTrainingData()
  }

  // Carregar dades d'entrenament des del localStorage
  private loadTrainingData() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('ml-training-data')
        if (stored) {
          this.trainingData = JSON.parse(stored).map((data: any) => ({
            ...data,
            timestamp: new Date(data.timestamp)
          }))
        }
      } catch (error) {
        console.error('Error carregant dades d\'entrenament ML:', error)
      }
    }
  }

  // Guardar dades d'entrenament
  private saveTrainingData() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('ml-training-data', JSON.stringify(this.trainingData))
      } catch (error) {
        console.error('Error desant dades d\'entrenament ML:', error)
      }
    }
  }

  // Afegir nova observació per entrenar el model
  addTrainingData(data: Omit<MLTrainingData, 'timeOfDay' | 'dayOfYear'>) {
    const date = data.timestamp
    const trainingPoint: MLTrainingData = {
      ...data,
      timeOfDay: date.getHours(),
      dayOfYear: this.getDayOfYear(date)
    }

    this.trainingData.push(trainingPoint)
    
    // Mantenir només les últimes 1000 observacions
    if (this.trainingData.length > 1000) {
      this.trainingData = this.trainingData.slice(-1000)
    }

    this.saveTrainingData()
    this.trainModels()
  }

  // Entrenar models per cada spot
  private trainModels() {
    const spotData = this.groupBySpot()
    
    spotData.forEach((data, spot) => {
      if (data.length >= 10) { // Mínim 10 observacions per entrenar
        const model = this.trainSpotModel(data)
        this.models.set(spot, model)
      }
    })
    
    this.isInitialized = true
  }

  // Agrupar dades per spot
  private groupBySpot(): Map<string, MLTrainingData[]> {
    const grouped = new Map<string, MLTrainingData[]>()
    
    this.trainingData.forEach(data => {
      if (!grouped.has(data.spot)) {
        grouped.set(data.spot, [])
      }
      grouped.get(data.spot)!.push(data)
    })
    
    return grouped
  }

  // Entrenar model simple per un spot específic
  private trainSpotModel(data: MLTrainingData[]) {
    // Model simple basat en mitjanes ponderades i correlacions
    const recentData = data.slice(-50) // Últimes 50 observacions
    
    // Calcular factors de correcció per velocitat del vent
    const speedCorrections = recentData.map(d => ({
      ratio: d.actualWindSpeed / Math.max(0.1, d.modelWindSpeed),
      timeOfDay: d.timeOfDay,
      dayOfYear: d.dayOfYear,
      confidence: d.confidence
    }))

    // Calcular factors de correcció per direcció del vent
    const directionCorrections = recentData.map(d => ({
      difference: this.angleDifference(d.actualWindDirection, d.modelWindDirection),
      timeOfDay: d.timeOfDay,
      dayOfYear: d.dayOfYear,
      confidence: d.confidence
    }))

    return {
      speedCorrections,
      directionCorrections,
      dataCount: recentData.length,
      lastTrained: new Date()
    }
  }

  // Fer predicció millorada amb ML
  predict(spot: string, modelData: {
    windSpeed: number
    windDirection: number
    temperature: number
    humidity: number
    pressure: number
    timestamp: Date
  }): MLPrediction {
    
    if (!this.isInitialized || !this.models.has(spot)) {
      // Si no hi ha model entrenat, retornar dades originals
      return {
        windSpeed: modelData.windSpeed,
        windDirection: modelData.windDirection,
        confidence: 0.5,
        adjustmentFactor: 1.0
      }
    }

    const model = this.models.get(spot)!
    const timeOfDay = modelData.timestamp.getHours()
    const dayOfYear = this.getDayOfYear(modelData.timestamp)

    // Predicció de velocitat del vent
    const speedFactor = this.predictSpeedFactor(model.speedCorrections, timeOfDay, dayOfYear)
    const adjustedWindSpeed = Math.max(0, Math.round(modelData.windSpeed * speedFactor))

    // Predicció de direcció del vent
    const directionOffset = this.predictDirectionOffset(model.directionCorrections, timeOfDay, dayOfYear)
    let adjustedWindDirection = modelData.windDirection + directionOffset
    
    // Normalitzar direcció
    adjustedWindDirection = ((adjustedWindDirection % 360) + 360) % 360

    // Calcular confiança basada en la quantitat de dades
    const confidence = Math.min(0.9, 0.5 + (model.dataCount / 100) * 0.4)

    return {
      windSpeed: adjustedWindSpeed,
      windDirection: Math.round(adjustedWindDirection),
      confidence,
      adjustmentFactor: speedFactor
    }
  }

  // Predir factor de correcció de velocitat
  private predictSpeedFactor(corrections: any[], timeOfDay: number, dayOfYear: number): number {
    if (corrections.length === 0) return 1.0

    // Trobar correccions similars (mateix hora del dia ±2h)
    const similarTime = corrections.filter(c => 
      Math.abs(c.timeOfDay - timeOfDay) <= 2 || 
      Math.abs(c.timeOfDay - timeOfDay) >= 22 // Wrap around midnight
    )

    if (similarTime.length === 0) {
      // Usar totes les correccions si no hi ha similars
      const totalWeight = corrections.reduce((sum, c) => sum + c.confidence, 0)
      const weightedSum = corrections.reduce((sum, c) => sum + c.ratio * c.confidence, 0)
      return weightedSum / totalWeight
    }

    // Calcular mitjana ponderada de correccions similars
    const totalWeight = similarTime.reduce((sum, c) => sum + c.confidence, 0)
    const weightedSum = similarTime.reduce((sum, c) => sum + c.ratio * c.confidence, 0)
    
    return Math.max(0.5, Math.min(2.0, weightedSum / totalWeight))
  }

  // Predir offset de direcció
  private predictDirectionOffset(corrections: any[], timeOfDay: number, dayOfYear: number): number {
    if (corrections.length === 0) return 0

    // Trobar correccions similars
    const similarTime = corrections.filter(c => 
      Math.abs(c.timeOfDay - timeOfDay) <= 2 || 
      Math.abs(c.timeOfDay - timeOfDay) >= 22
    )

    if (similarTime.length === 0) {
      const totalWeight = corrections.reduce((sum, c) => sum + c.confidence, 0)
      const weightedSum = corrections.reduce((sum, c) => sum + c.difference * c.confidence, 0)
      return weightedSum / totalWeight
    }

    const totalWeight = similarTime.reduce((sum, c) => sum + c.confidence, 0)
    const weightedSum = similarTime.reduce((sum, c) => sum + c.difference * c.confidence, 0)
    
    return Math.max(-45, Math.min(45, weightedSum / totalWeight))
  }

  // Utilitats
  private getDayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 0)
    const diff = date.getTime() - start.getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  }

  private angleDifference(actual: number, predicted: number): number {
    let diff = actual - predicted
    if (diff > 180) diff -= 360
    if (diff < -180) diff += 360
    return diff
  }

  // Obtenir estadístiques del model
  getModelStats(spot: string) {
    if (!this.models.has(spot)) {
      return null
    }

    const model = this.models.get(spot)!
    const spotData = this.trainingData.filter(d => d.spot === spot)
    
    return {
      dataPoints: model.dataCount,
      lastTrained: model.lastTrained,
      totalObservations: spotData.length,
      averageAccuracy: this.calculateAccuracy(spotData),
      isActive: model.dataCount >= 10
    }
  }

  private calculateAccuracy(data: MLTrainingData[]): number {
    if (data.length === 0) return 0

    const recent = data.slice(-20) // Últimes 20 observacions
    const errors = recent.map(d => {
      const speedError = Math.abs(d.actualWindSpeed - d.modelWindSpeed) / Math.max(1, d.actualWindSpeed)
      const directionError = Math.abs(this.angleDifference(d.actualWindDirection, d.modelWindDirection)) / 180
      return (speedError + directionError) / 2
    })

    const avgError = errors.reduce((sum, err) => sum + err, 0) / errors.length
    return Math.max(0, Math.min(1, 1 - avgError))
  }
}

export const weatherML = new WeatherMLService()