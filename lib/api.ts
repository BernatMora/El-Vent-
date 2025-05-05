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
    const apiUrl = `/api/wind-data?spot=${encodeURIComponent(spot)}&_t=${timestamp}&nocache=true`
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

// Simulación de datos de previsión (fallback)
function getFallbackData(spot: string) {
  // Datos base - Valores simulados con viento real
  const baseData = [
    {
      date: new Date().toISOString().split("T")[0],
      hours: [
        { time: "09:00", windSpeed: 8, windDirection: 90, windGust: 12, temperature: 14.3, humidity: 89 },
        { time: "10:00", windSpeed: 10, windDirection: 90, windGust: 15, temperature: 15.4, humidity: 82 },
        { time: "11:00", windSpeed: 12, windDirection: 90, windGust: 18, temperature: 17.5, humidity: 74 },
        { time: "12:00", windSpeed: 14, windDirection: 90, windGust: 20, temperature: 18.5, humidity: 70 },
        { time: "13:00", windSpeed: 15, windDirection: 90, windGust: 22, temperature: 19.4, humidity: 66 },
        { time: "14:00", windSpeed: 16, windDirection: 90, windGust: 24, temperature: 20.1, humidity: 60 },
        { time: "15:00", windSpeed: 15, windDirection: 90, windGust: 23, temperature: 19.9, humidity: 63 },
        { time: "16:00", windSpeed: 14, windDirection: 90, windGust: 21, temperature: 19.3, humidity: 67 },
        { time: "17:00", windSpeed: 12, windDirection: 90, windGust: 18, temperature: 18.9, humidity: 70 },
        { time: "18:00", windSpeed: 10, windDirection: 90, windGust: 15, temperature: 18.5, humidity: 73 },
        { time: "19:00", windSpeed: 8, windDirection: 90, windGust: 12, temperature: 18.0, humidity: 76 },
        { time: "20:00", windSpeed: 6, windDirection: 90, windGust: 9, temperature: 17.2, humidity: 79 },
        { time: "21:00", windSpeed: 4, windDirection: 90, windGust: 6, temperature: 15.8, humidity: 90 },
      ],
    },
    {
      date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      hours: [
        { time: "09:00", windSpeed: 6, windDirection: 315, windGust: 9, temperature: 15.0, humidity: 85 },
        { time: "10:00", windSpeed: 8, windDirection: 315, windGust: 12, temperature: 16.2, humidity: 80 },
        { time: "11:00", windSpeed: 10, windDirection: 45, windGust: 15, temperature: 17.8, humidity: 75 },
        { time: "12:00", windSpeed: 12, windDirection: 90, windGust: 18, temperature: 19.0, humidity: 68 },
        { time: "13:00", windSpeed: 14, windDirection: 90, windGust: 21, temperature: 20.2, humidity: 62 },
        { time: "14:00", windSpeed: 16, windDirection: 90, windGust: 24, temperature: 21.0, humidity: 58 },
        { time: "15:00", windSpeed: 18, windDirection: 90, windGust: 27, temperature: 20.8, humidity: 60 },
        { time: "16:00", windSpeed: 18, windDirection: 90, windGust: 27, temperature: 20.0, humidity: 65 },
        { time: "17:00", windSpeed: 16, windDirection: 90, windGust: 24, temperature: 19.5, humidity: 68 },
        { time: "18:00", windSpeed: 14, windDirection: 90, windGust: 21, temperature: 19.0, humidity: 72 },
        { time: "19:00", windSpeed: 12, windDirection: 135, windGust: 18, temperature: 18.5, humidity: 75 },
        { time: "20:00", windSpeed: 10, windDirection: 135, windGust: 15, temperature: 17.5, humidity: 80 },
        { time: "21:00", windSpeed: 8, windDirection: 135, windGust: 12, temperature: 16.0, humidity: 85 },
      ],
    },
    {
      date: new Date(Date.now() + 172800000).toISOString().split("T")[0],
      hours: [
        { time: "09:00", windSpeed: 5, windDirection: 315, windGust: 8, temperature: 14.5, humidity: 88 },
        { time: "10:00", windSpeed: 7, windDirection: 315, windGust: 11, temperature: 15.8, humidity: 82 },
        { time: "11:00", windSpeed: 9, windDirection: 45, windGust: 14, temperature: 17.0, humidity: 78 },
        { time: "12:00", windSpeed: 11, windDirection: 90, windGust: 17, temperature: 18.2, humidity: 72 },
        { time: "13:00", windSpeed: 13, windDirection: 90, windGust: 20, temperature: 19.5, humidity: 65 },
        { time: "14:00", windSpeed: 15, windDirection: 90, windGust: 23, temperature: 20.5, humidity: 60 },
        { time: "15:00", windSpeed: 17, windDirection: 90, windGust: 26, temperature: 20.2, humidity: 62 },
        { time: "16:00", windSpeed: 17, windDirection: 90, windGust: 26, temperature: 19.8, humidity: 65 },
        { time: "17:00", windSpeed: 15, windDirection: 90, windGust: 23, temperature: 19.0, humidity: 70 },
        { time: "18:00", windSpeed: 13, windDirection: 90, windGust: 20, temperature: 18.5, humidity: 75 },
        { time: "19:00", windSpeed: 11, windDirection: 135, windGust: 17, temperature: 17.8, humidity: 80 },
        { time: "20:00", windSpeed: 9, windDirection: 135, windGust: 14, temperature: 16.5, humidity: 85 },
        { time: "21:00", windSpeed: 7, windDirection: 135, windGust: 11, temperature: 15.0, humidity: 90 },
      ],
    },
  ]

  // Ajustar datos según el spot seleccionado
  let adjustedData = JSON.parse(JSON.stringify(baseData))

  if (spot === "la-gaviota") {
    // La Gaviota tiene vientos ligeramente más fuertes y más constantes
    adjustedData = adjustedData.map((day: any) => {
      day.hours = day.hours.map((hour: any) => {
        return {
          ...hour,
          windSpeed: hour.windSpeed === 0 ? 0 : Math.max(1, Math.round(hour.windSpeed * 1.15)),
          windGust: hour.windGust === 0 ? 0 : Math.round(hour.windGust * 1.1),
          windDirection: hour.windSpeed === 0 ? 0 : (hour.windDirection + 15) % 360,
        }
      })
      return day
    })
  } else if (spot === "aquarius") {
    // Aquarius tiene vientos ligeramente más débiles pero más constantes
    adjustedData = adjustedData.map((day: any) => {
      day.hours = day.hours.map((hour: any) => {
        return {
          ...hour,
          windSpeed: hour.windSpeed === 0 ? 0 : Math.max(1, Math.round(hour.windSpeed * 0.9)),
          windGust: hour.windGust === 0 ? 0 : Math.round(hour.windGust * 0.85),
          windDirection: hour.windSpeed === 0 ? 0 : (hour.windDirection - 10 + 360) % 360,
        }
      })
      return day
    })
  }

  return adjustedData
}
