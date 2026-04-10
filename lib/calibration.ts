// Sistema de calibració local basat en observacions reals
export interface WindObservation {
  id: string
  timestamp: Date
  spot: string
  reportedWindSpeed: number
  reportedDirection: number
  modelWindSpeed: number
  modelDirection: number
  userId?: string
  verified: boolean
}

export interface CalibrationFactor {
  spot: string
  speedMultiplier: number
  directionOffset: number
  lastUpdated: Date
  observationCount: number
}

class WindCalibrationService {
  private observations: WindObservation[] = []
  private calibrationFactors: Map<string, CalibrationFactor> = new Map()
  private listeners: Set<() => void> = new Set()

  constructor() {
    this.loadFromStorage()
    this.initializeDefaultFactors()
  }

  // Mètode per subscriure's a canvis
  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  // Notificar als listeners
  private notifyListeners() {
    this.listeners.forEach(listener => listener())
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('wind-observations')
        if (stored) {
          this.observations = JSON.parse(stored).map((obs: any) => ({
            ...obs,
            timestamp: new Date(obs.timestamp)
          }))
        }

        const factors = localStorage.getItem('calibration-factors')
        if (factors) {
          const parsed = JSON.parse(factors)
          Object.entries(parsed).forEach(([spot, factor]: [string, any]) => {
            this.calibrationFactors.set(spot, {
              ...factor,
              lastUpdated: new Date(factor.lastUpdated)
            })
          })
        }
      } catch (error) {
        console.error('Error carregant dades de calibració:', error)
      }
    }
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('wind-observations', JSON.stringify(this.observations))
        
        const factorsObj: any = {}
        this.calibrationFactors.forEach((factor, spot) => {
          factorsObj[spot] = factor
        })
        localStorage.setItem('calibration-factors', JSON.stringify(factorsObj))
      } catch (error) {
        console.error('Error desant dades de calibració:', error)
      }
    }
  }

  private initializeDefaultFactors() {
    // Canviar l'ordre perquè kitesurf-point sigui el primer (per defecte)
    const spots = ['kitesurf-point', 'la-ballena', 'can-martinet', 'la-rubina']
    
    spots.forEach(spot => {
      if (!this.calibrationFactors.has(spot)) {
        this.calibrationFactors.set(spot, {
          spot,
          speedMultiplier: 1.0,
          directionOffset: 0,
          lastUpdated: new Date(),
          observationCount: 0
        })
      }
    })
  }

  addObservation(observation: Omit<WindObservation, 'id' | 'timestamp' | 'verified'>) {
    const newObservation: WindObservation = {
      ...observation,
      id: Date.now().toString(),
      timestamp: new Date(),
      verified: false
    }

    this.observations.push(newObservation)
    
    // Mantenir només les últimes 100 observacions
    if (this.observations.length > 100) {
      this.observations = this.observations.slice(-100)
    }

    this.updateCalibrationFactor(observation.spot)
    this.saveToStorage()
    this.notifyListeners()

    return newObservation
  }

  private updateCalibrationFactor(spot: string) {
    const recentObservations = this.observations
      .filter(obs => obs.spot === spot)
      .filter(obs => {
        const hoursSince = (Date.now() - obs.timestamp.getTime()) / (1000 * 60 * 60)
        return hoursSince <= 24 // Només les últimes 24 hores
      })

    if (recentObservations.length === 0) return

    // Per la primera observació, usar directament la diferència
    if (recentObservations.length === 1) {
      const obs = recentObservations[0]
      if (obs.modelWindSpeed > 0) {
        const speedMultiplier = obs.reportedWindSpeed / obs.modelWindSpeed
        let directionOffset = obs.reportedDirection - obs.modelDirection
        
        // Normalitzar diferència d'angles
        if (directionOffset > 180) directionOffset -= 360
        if (directionOffset < -180) directionOffset += 360

        this.calibrationFactors.set(spot, {
          spot,
          speedMultiplier: Math.max(0.5, Math.min(2.0, speedMultiplier)), // Limitar entre 0.5x i 2x
          directionOffset: Math.max(-45, Math.min(45, directionOffset)), // Limitar a ±45°
          lastUpdated: new Date(),
          observationCount: 1
        })
      }
      return
    }

    // Per múltiples observacions, calcular mitjana ponderada
    const speedRatios = recentObservations
      .filter(obs => obs.modelWindSpeed > 0)
      .map(obs => obs.reportedWindSpeed / obs.modelWindSpeed)

    const directionOffsets = recentObservations.map(obs => {
      const diff = obs.reportedDirection - obs.modelDirection
      return ((diff % 360) + 540) % 360 - 180
    })

    if (speedRatios.length > 0) {
      const avgSpeedMultiplier = speedRatios.reduce((a, b) => a + b, 0) / speedRatios.length
      const avgDirectionOffset = directionOffsets.reduce((a, b) => a + b, 0) / directionOffsets.length

      // Aplicar suavitzat més agressiu per canvis immediats
      const currentFactor = this.calibrationFactors.get(spot)!
      const smoothingFactor = recentObservations.length === 1 ? 0.8 : 0.4 // Més agressiu per primera observació

      this.calibrationFactors.set(spot, {
        spot,
        speedMultiplier: Math.max(0.5, Math.min(2.0, 
          currentFactor.speedMultiplier * (1 - smoothingFactor) + avgSpeedMultiplier * smoothingFactor
        )),
        directionOffset: Math.max(-45, Math.min(45,
          currentFactor.directionOffset * (1 - smoothingFactor) + avgDirectionOffset * smoothingFactor
        )),
        lastUpdated: new Date(),
        observationCount: recentObservations.length
      })
    }
  }

  applyCalibration(spot: string, windSpeed: number, windDirection: number) {
    const factor = this.calibrationFactors.get(spot)
    if (!factor || factor.observationCount === 0) {
      return { windSpeed, windDirection }
    }

    const calibratedSpeed = Math.max(0, Math.round(windSpeed * factor.speedMultiplier))
    let calibratedDirection = windDirection + factor.directionOffset
    
    // Normalitzar direcció
    calibratedDirection = ((calibratedDirection % 360) + 360) % 360

    return {
      windSpeed: calibratedSpeed,
      windDirection: Math.round(calibratedDirection)
    }
  }

  getCalibrationInfo(spot: string) {
    return this.calibrationFactors.get(spot)
  }

  getRecentObservations(spot: string, hours: number = 6) {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000)
    return this.observations
      .filter(obs => obs.spot === spot)
      .filter(obs => obs.timestamp.getTime() > cutoff)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  getAllRecentObservations(hours: number = 6) {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000)
    return this.observations
      .filter(obs => obs.timestamp.getTime() > cutoff)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  // Mètode per forçar recalibració
  forceRecalibration(spot: string) {
    this.updateCalibrationFactor(spot)
    this.saveToStorage()
    this.notifyListeners()
  }
}

export const windCalibration = new WindCalibrationService()