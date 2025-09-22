import { protectedWeatherAPI } from "./protected-api"

export async function getForecastData(spot: string) {
  try {
    console.log("🛡️ getForecastData amb sistema protegit per spot:", spot)
    
    // Usar el sistema protegit (sempre gratuït)
    const protectedData = await protectedWeatherAPI.getForecastData(spot)
    
    console.log("✅ Dades protegides obtingudes:", protectedData.length, "dies")
    return protectedData
    
  } catch (error) {
    console.error("❌ Error en getForecastData protegit:", error)
    
    // Si hi ha error, propagar-lo per mostrar estat offline
    throw error
  }
}

// Funció per afegir observacions d'usuaris al sistema ML
export function addUserObservation(spot: string, observation: {
  reportedWindSpeed: number
  reportedDirection: number
  modelWindSpeed: number
  modelWindDirection: number
}) {
  enhancedWeatherService.addUserObservation(spot, {
    ...observation,
    temperature: 20, // Valors per defecte
    humidity: 70,
    pressure: 1013
  })
}

// Obtenir estadístiques del sistema millorat
export function getProtectionStats() {
  return protectedWeatherAPI.getProtectionStats()
}