// Función para obtener datos de pronóstico
export async function getForecastData(spot: string) {
  try {
    // Extraer el nombre del spot sin parámetros de consulta
    const cleanSpot = spot.split("?")[0]
    // Validar que el spot sea una cadena válida
    if (!cleanSpot || typeof cleanSpot !== "string" || !["aquarius", "la-gaviota"].includes(cleanSpot)) {
      console.error("Spot inválido:", spot)
      // Fallback a un spot por defecto
      spot = "aquarius"
    } else {
      spot = cleanSpot // Usar el spot limpio
    }

    // Construir la URL con encodeURIComponent para asegurar que sea válida
    const timestamp = new Date().getTime() // Añadir timestamp para evitar caché
    const randomStr = Math.random().toString(36).substring(2, 15) // Valor aleatorio adicional
    const apiUrl = `/api/wind-data?spot=${encodeURIComponent(spot)}&_t=${timestamp}&r=${randomStr}&nocache=true`
    console.log("Llamando a API:", apiUrl)

    // Intentar obtener datos del backend con más información de depuración
    const response = await fetch(apiUrl, {
      method: "GET",
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
        "X-Requested-With": "XMLHttpRequest",
        "X-Timestamp": timestamp.toString(),
        "X-Random": randomStr,
      },
      next: { revalidate: 0 },
    })

    // Registrar información sobre la respuesta para depuración
    console.log("Respuesta de API:", {
      status: response.status,
      statusText: response.statusText,
      source: response.headers.get("X-Data-Source") || "unknown",
      headers: Object.fromEntries(response.headers.entries()),
    })

    if (!response.ok) {
      throw new Error(`Error al obtener datos: ${response.status} ${response.statusText}`)
    }

    // Intentar analizar la respuesta como JSON con manejo de errores mejorado
    let data
    try {
      const text = await response.text()
      console.log("Texto de respuesta (primeros 200 caracteres):", text.substring(0, 200))
      data = JSON.parse(text)

      // Verificar que los datos tengan el formato esperado
      if (!Array.isArray(data) || data.length === 0) {
        console.error("Datos de pronóstico inválidos:", data)
        throw new Error("Formato de datos inválido")
      }

      // Asegurarse de que los valores de viento sean números positivos
      data.forEach((day) => {
        if (Array.isArray(day.hours)) {
          day.hours.forEach((hour) => {
            // Asegurarse de que windSpeed sea un número positivo
            if (typeof hour.windSpeed !== "number" || isNaN(hour.windSpeed)) {
              hour.windSpeed = 0
            } else {
              hour.windSpeed = Math.max(0, hour.windSpeed)
            }

            // Asegurarse de que windGust sea un número positivo
            if (typeof hour.windGust !== "number" || isNaN(hour.windGust)) {
              hour.windGust = hour.windSpeed * 1.2
            } else {
              hour.windGust = Math.max(0, hour.windGust)
            }
          })
        }
      })

      // Guardar timestamp de la última actualización
      if (typeof window !== "undefined") {
        localStorage.setItem("lastDataRefresh", new Date().getTime().toString())
      }

      console.log("Datos procesados correctamente")
    } catch (parseError) {
      console.error("Error al analizar JSON:", parseError)
      throw new Error("La respuesta no es un JSON válido")
    }

    return data
  } catch (error) {
    console.error("Error obteniendo datos de pronóstico:", error)
    // Fallback a datos simulados en caso de error
    console.log("Usando datos de fallback")
    return getFallbackData(spot)
  }
}

// Mock data for testing purposes
const getFallbackData = (spot: string) => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const dayAfterTomorrow = new Date(today)
  dayAfterTomorrow.setDate(today.getDate() + 2)

  const mockData = [
    {
      date: today.toISOString().split("T")[0],
      hours: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        windSpeed: Math.random() * 15 + 5, // Wind speed between 5 and 20
        windGust: Math.random() * 5 + 20, // Wind gust between 20 and 25
        windDirection: Math.floor(Math.random() * 360), // Wind direction between 0 and 359
      })),
    },
    {
      date: tomorrow.toISOString().split("T")[0],
      hours: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        windSpeed: Math.random() * 15 + 5,
        windGust: Math.random() * 5 + 20,
        windDirection: Math.floor(Math.random() * 360),
      })),
    },
    {
      date: dayAfterTomorrow.toISOString().split("T")[0],
      hours: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        windSpeed: Math.random() * 15 + 5,
        windGust: Math.random() * 5 + 20,
        windDirection: Math.floor(Math.random() * 360),
      })),
    },
  ]

  return mockData
}
