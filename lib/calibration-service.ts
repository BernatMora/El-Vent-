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
  
  // Calcular factors de correcció
  const windSpeedFactor = data.forecastWindSpeed > 0 ? data.realWindSpeed / data.forecastWindSpeed : 1
  const windGustFactor = data.forecastWindGust > 0 ? data.realWindGust / data.forecastWindGust : 1
  
  // Utilitzar els noms de columnes reals de la base de dades
  const { error } = await supabase.from("wind_calibration").insert({
    predicted_wind_speed: data.forecastWindSpeed,
    predicted_wind_gust: data.forecastWindGust,
    predicted_wind_direction: data.forecastDirection,
    real_wind_speed: data.realWindSpeed,
    real_wind_gust: data.realWindGust,
    real_wind_direction: data.realDirection,
    wind_speed_factor: Math.round(windSpeedFactor * 1000) / 1000,
    wind_gust_factor: Math.round(windGustFactor * 1000) / 1000,
    measurement_time: data.forecastTimestamp,
    source: "camping_aquarius",
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
  
  if (error || !entries || entries.length < 1) {
    console.log("No hi ha prou dades per calibrar")
    return
  }
  
  // Agrupar per direcció de vent (categoria)
  const byDirection: Record<string, typeof entries> = {}
  for (const entry of entries) {
    const dir = getWindDirectionCategory(entry.predicted_wind_direction || 0)
    if (!byDirection[dir]) byDirection[dir] = []
    byDirection[dir].push(entry)
  }
  
  // Calcular factors per cada direcció
  for (const [direction, dirEntries] of Object.entries(byDirection)) {
    if (dirEntries.length < 1) continue
    
    // Calcular factors mitjans
    const avgWindSpeedFactor = dirEntries.reduce((sum, e) => sum + (e.wind_speed_factor || 1), 0) / dirEntries.length
    const avgWindGustFactor = dirEntries.reduce((sum, e) => sum + (e.wind_gust_factor || 1), 0) / dirEntries.length
    
    // Calcular confiança basada en el nombre d'entrades
    const confidence = Math.min(dirEntries.length / 10, 1) // Max confiança amb 10+ entrades
    
    // Obtenir rang de direccions per aquesta categoria
    const dirRanges: Record<string, { min: number; max: number }> = {
      "N": { min: 337, max: 22 },
      "NE": { min: 22, max: 67 },
      "E": { min: 67, max: 112 },
      "SE": { min: 112, max: 157 },
      "S": { min: 157, max: 202 },
      "SW": { min: 202, max: 247 },
      "W": { min: 247, max: 292 },
      "NW": { min: 292, max: 337 }
    }
    const range = dirRanges[direction] || { min: 0, max: 360 }
    
    // Upsert del factor
    await supabase.from("calibration_factors").upsert({
      direction_name: direction,
      wind_direction_min: range.min,
      wind_direction_max: range.max,
      avg_wind_speed_factor: Math.round(avgWindSpeedFactor * 1000) / 1000,
      avg_wind_gust_factor: Math.round(avgWindGustFactor * 1000) / 1000,
      sample_count: dirEntries.length,
      confidence: Math.round(confidence * 100) / 100,
      updated_at: new Date().toISOString()
    }, {
      onConflict: "direction_name"
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
    factors[row.direction_name] = {
      windSpeedFactor: row.avg_wind_speed_factor || 1,
      windGustFactor: row.avg_wind_gust_factor || 1,
      confidence: row.confidence || 0,
      sampleCount: row.sample_count || 0
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
