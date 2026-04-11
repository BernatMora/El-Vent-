// API millorada que combina múltiples fonts amb Machine Learning
import { MultiWeatherService } from './weather-apis'
import { weatherML, MLTrainingData } from './ml-predictions'
import { windCalibration } from './calibration'
import { getSpotCoords } from './spot-coordinates'

export class EnhancedWeatherService {
  private multiWeatherService = new MultiWeatherService()
  private lastUpdate = new Map<string, Date>()

  async getEnhancedForecast(spot: string) {
    try {
      console.log(`Obtenint previsió millorada per ${spot}...`)

      const coords = getSpotCoords(spot)

      // 1. Obtenir dades agregades de múltiples APIs
      const multiApiData = await this.multiWeatherService.getAggregatedWeatherData(coords.lat, coords.lon)

      // 2. Aplicar Machine Learning per millorar prediccions
      const mlEnhancedData = multiApiData.map(data => {
        const prediction = weatherML.predict(spot, {
          windSpeed: data.windSpeed,
          windDirection: data.windDirection,
          temperature: data.temperature,
          humidity: data.humidity,
          pressure: data.pressure || 1013,
          timestamp: new Date(data.timestamp)
        })

        return {
          ...data,
          windSpeed: prediction.windSpeed,
          windDirection: prediction.windDirection,
          mlConfidence: prediction.confidence,
          mlAdjustmentFactor: prediction.adjustmentFactor,
          isMLEnhanced: prediction.confidence > 0.6
        }
      })

      // 3. Aplicar calibració basada en reportes d'usuaris
      const calibratedData = mlEnhancedData.map(data => {
        const calibrated = windCalibration.applyCalibration(spot, data.windSpeed, data.windDirection)
        
        return {
          ...data,
          windSpeed: calibrated.windSpeed,
          windDirection: calibrated.windDirection,
          originalWindSpeed: data.windSpeed,
          originalWindDirection: data.windDirection,
          isCalibrated: true
        }
      })

      // 4. Organitzar per dies
      const organizedData = this.organizeByDays(calibratedData)
      
      this.lastUpdate.set(spot, new Date())
      
      console.log(`Previsió millorada obtinguda: ${organizedData.length} dies`)
      return organizedData

    } catch (error) {
      console.error('Error en previsió millorada:', error)
      // Fallback a dades simulades si tot falla
      return this.generateFallbackData()
    }
  }

  // Organitzar dades per dies
  private organizeByDays(data: any[]) {
    const dayGroups = new Map<string, any[]>()
    
    data.forEach(item => {
      const date = item.timestamp.split('T')[0]
      const hour = new Date(item.timestamp).getHours()
      
      // Només hores de navegació
      if (hour >= 9 && hour <= 21) {
        if (!dayGroups.has(date)) {
          dayGroups.set(date, [])
        }
        
        dayGroups.get(date)!.push({
          time: `${hour.toString().padStart(2, '0')}:00`,
          windSpeed: Math.round(item.windSpeed),
          windDirection: Math.round(item.windDirection),
          windGust: Math.round(item.windGust),
          temperature: Math.round(item.temperature),
          humidity: Math.round(item.humidity),
          pressure: item.pressure,
          source: item.source,
          confidence: item.confidence,
          mlConfidence: item.mlConfidence,
          mlAdjustmentFactor: item.mlAdjustmentFactor,
          isMLEnhanced: item.isMLEnhanced,
          isCalibrated: item.isCalibrated,
          originalWindSpeed: item.originalWindSpeed,
          originalWindDirection: item.originalWindDirection
        })
      }
    })

    // Convertir a format esperat
    return Array.from(dayGroups.entries())
      .slice(0, 3)
      .map(([date, hours]) => ({
        date,
        hours: hours.sort((a, b) => a.time.localeCompare(b.time))
      }))
  }

  // Afegir dades d'entrenament quan un usuari reporta condicions reals
  addUserObservation(spot: string, observation: {
    reportedWindSpeed: number
    reportedDirection: number
    modelWindSpeed: number
    modelWindDirection: number
    temperature: number
    humidity: number
    pressure: number
  }) {
    const trainingData: Omit<MLTrainingData, 'timeOfDay' | 'dayOfYear'> = {
      modelWindSpeed: observation.modelWindSpeed,
      modelWindDirection: observation.modelWindDirection,
      modelTemperature: observation.temperature,
      modelHumidity: observation.humidity,
      modelPressure: observation.pressure,
      spot,
      actualWindSpeed: observation.reportedWindSpeed,
      actualWindDirection: observation.reportedDirection,
      timestamp: new Date(),
      confidence: 0.8 // Confiança alta per observacions d'usuaris
    }

    weatherML.addTrainingData(trainingData)
    console.log('Dades d\'entrenament afegides al model ML')
  }

  // Obtenir estadístiques dels models ML
  getMLStats(spot: string) {
    return weatherML.getModelStats(spot)
  }

  // Obtenir informació sobre les fonts de dades
  getDataSourceInfo(spot: string) {
    const lastUpdate = this.lastUpdate.get(spot)
    const mlStats = this.getMLStats(spot)
    const calibrationInfo = windCalibration.getCalibrationInfo(spot)

    return {
      lastUpdate: lastUpdate?.toLocaleTimeString('ca-ES') || 'Mai',
      multiApi: {
        enabled: true,
        sources: ['Open-Meteo', 'WeatherAPI', 'OpenWeatherMap'],
        status: 'Actiu'
      },
      machineLearning: {
        enabled: mlStats?.isActive || false,
        dataPoints: mlStats?.dataPoints || 0,
        accuracy: mlStats ? Math.round(mlStats.averageAccuracy * 100) : 0,
        lastTrained: mlStats?.lastTrained?.toLocaleDateString('ca-ES') || 'Mai'
      },
      userCalibration: {
        enabled: (calibrationInfo?.observationCount || 0) > 0,
        observations: calibrationInfo?.observationCount || 0,
        speedAdjustment: calibrationInfo ? Math.round((calibrationInfo.speedMultiplier - 1) * 100) : 0,
        directionAdjustment: calibrationInfo?.directionOffset || 0
      }
    }
  }

  // Dades de fallback si tot falla
  private generateFallbackData() {
    console.log("Generant dades de fallback...")
    const now = new Date()
    const days = []

    for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
      const date = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000)
      const dateString = date.toISOString().split("T")[0]
      const hours = []

      for (let hour = 9; hour <= 21; hour++) {
        let baseWindSpeed = 8 + Math.sin(((hour - 11) / 6) * Math.PI) * 4
        baseWindSpeed += (Math.random() - 0.5) * 3
        
        const roundedWindSpeed = Math.max(1, Math.round(baseWindSpeed))
        // Assegurar que les ràfegues sempre siguin >= al vent sostingut
        const windGust = Math.round(Math.max(baseWindSpeed * 1.3, baseWindSpeed))

        hours.push({
          time: `${hour.toString().padStart(2, "0")}:00`,
          windSpeed: roundedWindSpeed,
          windDirection: Math.round(90 + (Math.random() - 0.5) * 60),
          windGust,
          temperature: Math.round(20 + (hour - 12) * 0.5),
          humidity: Math.round(70 + Math.random() * 20),
          source: "Simulat",
          confidence: 0.3,
          isMLEnhanced: false,
          isCalibrated: false
        })
      }

      days.push({ date: dateString, hours })
    }

    return days
  }
}

export const enhancedWeatherService = new EnhancedWeatherService()
