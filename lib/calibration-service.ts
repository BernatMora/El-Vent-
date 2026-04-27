import { createApiClient } from "@/lib/supabase/api"

// Categoritzar la direcció del vent
export function getWindDirectionCategory(degrees: number): string {
  if (degrees >= 337.5 || degrees < 22.5) return "N"
  if (degrees >= 22.5 && degrees < 67.5) return "NE"
  if (degrees >= 67.5 && degrees < 112.5) return "E"
  if (degrees >= 112.5 && degrees < 157.5) return "SE"
  if (degrees >= 157.5 && degrees < 202.5) return "S"
  if (degrees >= 202.5 && degrees < 247.5) return "SW"
  if (degrees >= 247.5 && degrees < 292.5) return "W"
  if (degrees >= 292.5 && degrees < 337.5) return "NW"
  return "N"
}

// Obtenir el nom del vent en català
export function getWindName(degrees: number): string {
  const category = getWindDirectionCategory(degrees)
  const names: Record<string, string> = {
    "N": "Tramuntana",
    "NE": "Gregal",
    "E": "Llevant",
    "SE": "Xaloc",
    "S": "Migjorn",
    "SW": "Garbí/Llebeig",
    "W": "Ponent",
    "NW": "Mestral"
  }
  return names[category] || "Desconegut"
}

// Guardar una entrada de calibratge
export async function saveCalibrationEntry(data: {
  forecastWindSpeed: number
  forecastWindGust: number
  forecastDirection: number
  realWindSpeed: number
  realWindGust: number
  realDirection: number
  forecastTimestamp: string
  notes?: string
}) {
  const supabase = createApiClient()
  
  const directionCategory = getWindDirectionCategory(data.forecastDirection)
  const measurementHour = new Date(data.forecastTimestamp).getHours()
  
  // Calcular errors
  const windSpeedError = data.realWindSpeed - data.forecastWindSpeed
  const windGustError = data.realWindGust - data.forecastWindGust
  const directionError = Math.abs(data.realDirection - data.forecastDirection)
  
  const { error } = await supabase.from("wind_calibration").insert({
    forecast_wind_speed: data.forecastWindSpeed,
    forecast_wind_gust: data.forecastWindGust,
    forecast_direction: data.forecastDirection,
    real_wind_speed: data.realWindSpeed,
    real_wind_gust: data.realWindGust,
    real_direction: data.realDirection,
    direction_category: directionCategory,
    measurement_hour: measurementHour,
    forecast_timestamp: data.forecastTimestamp,
    wind_speed_error: windSpeedError,
    wind_gust_error: windGustError,
    direction_error: directionError,
    notes: data.notes
  })
  
  if (error) throw error
  
  // Recalcular factors de calibratge
  await recalculateCalibrationFactors()
}

// Recalcular els factors de calibratge basant-se en l'historial
export async function recalculateCalibrationFactors() {
  const supabase = createApiClient()
  
  // Obtenir totes les entrades de calibratge
  const { data: entries, error } = await supabase
    .from("wind_calibration")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100) // Últimes 100 entrades
  
  if (error || !entries || entries.length < 3) {
    console.log("No hi ha prou dades per calibrar (mínim 3 entrades)")
    return
  }
  
  // Agrupar per direcció de vent
  const byDirection: Record<string, typeof entries> = {}
  for (const entry of entries) {
    const dir = entry.direction_category
    if (!byDirection[dir]) byDirection[dir] = []
    byDirection[dir].push(entry)
  }
  
  // Calcular factors per cada direcció
  for (const [direction, dirEntries] of Object.entries(byDirection)) {
    if (dirEntries.length < 2) continue
    
    // Calcular mitjanes d'error
    const avgWindSpeedError = dirEntries.reduce((sum, e) => sum + e.wind_speed_error, 0) / dirEntries.length
    const avgWindGustError = dirEntries.reduce((sum, e) => sum + e.wind_gust_error, 0) / dirEntries.length
    
    // Calcular factors de correcció (ratio real/previst)
    const avgForecastSpeed = dirEntries.reduce((sum, e) => sum + e.forecast_wind_speed, 0) / dirEntries.length
    const avgRealSpeed = dirEntries.reduce((sum, e) => sum + e.real_wind_speed, 0) / dirEntries.length
    const windSpeedFactor = avgForecastSpeed > 0 ? avgRealSpeed / avgForecastSpeed : 1
    
    const avgForecastGust = dirEntries.reduce((sum, e) => sum + e.forecast_wind_gust, 0) / dirEntries.length
    const avgRealGust = dirEntries.reduce((sum, e) => sum + e.real_wind_gust, 0) / dirEntries.length
    const windGustFactor = avgForecastGust > 0 ? avgRealGust / avgForecastGust : 1
    
    // Calcular confiança basada en el nombre d'entrades i la variància
    const confidence = Math.min(dirEntries.length / 20, 1) // Max confiança amb 20+ entrades
    
    // Upsert del factor
    await supabase.from("calibration_factors").upsert({
      direction_category: direction,
      wind_speed_factor: Math.round(windSpeedFactor * 1000) / 1000,
      wind_gust_factor: Math.round(windGustFactor * 1000) / 1000,
      sample_count: dirEntries.length,
      avg_speed_error: Math.round(avgWindSpeedError * 10) / 10,
      avg_gust_error: Math.round(avgWindGustError * 10) / 10,
      confidence: Math.round(confidence * 100) / 100,
      updated_at: new Date().toISOString()
    }, {
      onConflict: "direction_category"
    })
  }
}

// Obtenir els factors de calibratge actuals
export async function getCalibrationFactors(): Promise<Record<string, {
  windSpeedFactor: number
  windGustFactor: number
  confidence: number
  sampleCount: number
}>> {
  const supabase = createApiClient()
  
  const { data, error } = await supabase
    .from("calibration_factors")
    .select("*")
  
  if (error || !data) return {}
  
  const factors: Record<string, any> = {}
  for (const row of data) {
    factors[row.direction_category] = {
      windSpeedFactor: row.wind_speed_factor,
      windGustFactor: row.wind_gust_factor,
      confidence: row.confidence,
      sampleCount: row.sample_count
    }
  }
  
  return factors
}

// Aplicar calibratge a una previsió
export function applyCalibration(
  windSpeed: number,
  windGust: number,
  direction: number,
  factors: Record<string, { windSpeedFactor: number; windGustFactor: number; confidence: number }>
): { windSpeed: number; windGust: number; calibrated: boolean; confidence: number } {
  const category = getWindDirectionCategory(direction)
  const factor = factors[category]
  
  if (!factor || factor.confidence < 0.3) {
    // No hi ha prou dades per calibrar aquesta direcció
    return { windSpeed, windGust, calibrated: false, confidence: 0 }
  }
  
  // Aplicar factors amb interpolació basada en confiança
  const adjustedWindSpeed = Math.round(windSpeed * factor.windSpeedFactor)
  const adjustedWindGust = Math.round(windGust * factor.windGustFactor)
  
  return {
    windSpeed: adjustedWindSpeed,
    windGust: Math.max(adjustedWindGust, adjustedWindSpeed), // Ràfega sempre >= vent
    calibrated: true,
    confidence: factor.confidence
  }
}

// Obtenir historial de calibratge
export async function getCalibrationHistory(limit = 20) {
  const supabase = createApiClient()
  
  const { data, error } = await supabase
    .from("wind_calibration")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)
  
  if (error) throw error
  return data || []
}
