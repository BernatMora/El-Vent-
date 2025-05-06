import type { NextRequest } from "next/server"

// Coordenadas precisas de los spots de kitesurf
const SPOT_COORDINATES: Record<string, { lat: number; lon: number }> = {
  aquarius: { lat: 42.177, lon: 3.107 }, // Aquarius
  "la-gaviota": { lat: 42.226, lon: 3.119 }, // La Gaviota
}

export async function GET(request: NextRequest) {
  // Obtener el parámetro spot de la URL
  const searchParams = request.nextUrl.searchParams
  const spot = searchParams.get("spot")
  const timestamp = Date.now().toString()

  // Validar el spot
  if (!spot || !SPOT_COORDINATES[spot]) {
    return new Response(JSON.stringify({ error: "Spot no válido" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  }

  try {
    // Obtener las coordenadas del spot
    const { lat, lon } = SPOT_COORDINATES[spot]

    // Obtener la clave API de OpenWeatherMap
    const apiKey = process.env.OPENWEATHERMAP_API_KEY

    if (!apiKey) {
      console.error("API key de OpenWeatherMap no configurada")
      // En lugar de lanzar un error, usar datos de fallback
      return new Response(JSON.stringify(getFallbackData(spot)), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-Data-Source": "fallback",
          "X-Timestamp": timestamp,
          "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
        },
      })
    }

    // Construir la URL de la API de OpenWeatherMap para pronóstico de 5 días
    const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`

    console.log("Llamando a OpenWeatherMap API para", spot)

    // Realizar la solicitud a la API con opciones para evitar caché
    const response = await fetch(apiUrl, {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
      next: { revalidate: 0 },
    })

    if (!response.ok) {
      console.error(`Error en la respuesta de OpenWeatherMap: ${response.status} ${response.statusText}`)
      // En lugar de lanzar un error, usar datos de fallback
      return new Response(JSON.stringify(getFallbackData(spot)), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-Data-Source": "fallback",
          "X-Timestamp": timestamp,
          "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
        },
      })
    }

    // Obtener los datos de la API
    const weatherData = await response.json()

    // Transformar los datos al formato que espera nuestra aplicación
    const formattedData = transformWeatherData(weatherData)

    return new Response(JSON.stringify(formattedData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Data-Source": "openweathermap",
        "X-Timestamp": timestamp,
        "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error) {
    console.error("Error procesando solicitud:", error)

    // En caso de error, usar datos de fallback
    return new Response(JSON.stringify(getFallbackData(spot)), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Data-Source": "fallback",
        "X-Timestamp": timestamp,
        "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  }
}

// Función para transformar los datos de OpenWeatherMap al formato que espera nuestra aplicación
function transformWeatherData(weatherData: any) {
  // Agrupar los datos por día
  const groupedByDay: Record<string, any[]> = {}

  weatherData.list.forEach((item: any) => {
    // Convertir timestamp a fecha
    const date = new Date(item.dt * 1000)
    const dateStr = date.toISOString().split("T")[0]

    // Inicializar el array para este día si no existe
    if (!groupedByDay[dateStr]) {
      groupedByDay[dateStr] = []
    }

    // Extraer la hora en formato HH:MM
    const hours = date.getHours().toString().padStart(2, "0")
    const minutes = date.getMinutes().toString().padStart(2, "0")
    const timeStr = `${hours}:${minutes}`

    // Convertir velocidad del viento de m/s a nudos (1 m/s = 1.94384 nudos)
    const windSpeedKnots = Math.round(item.wind.speed * 1.94384)
    const windGustKnots = item.wind.gust ? Math.round(item.wind.gust * 1.94384) : Math.round(windSpeedKnots * 1.5)

    // Añadir los datos formateados
    groupedByDay[dateStr].push({
      time: timeStr,
      windSpeed: windSpeedKnots,
      windDirection: item.wind.deg,
      windGust: windGustKnots,
      temperature: Math.round(item.main.temp * 10) / 10,
      humidity: item.main.humidity,
      weather: item.weather[0].main,
      weatherDescription: item.weather[0].description,
      clouds: item.clouds.all,
      rain: item.rain ? item.rain["3h"] : 0,
    })
  })

  // Convertir el objeto agrupado a un array de días
  const result = Object.keys(groupedByDay).map((dateStr) => ({
    date: dateStr,
    hours: groupedByDay[dateStr],
  }))

  // Ordenar por fecha
  result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Devolver todos los días disponibles (hasta 5)
  return result.slice(0, 5)
}

// Función de fallback con datos simulados
function getFallbackData(spot: string) {
  // Generar fechas actuales
  const today = new Date()

  // Datos base - Valores simulados con viento real
  const baseData = [
    {
      date: today.toISOString().split("T")[0],
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
      date: new Date(today.getTime() + 86400000).toISOString().split("T")[0],
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
      date: new Date(today.getTime() + 172800000).toISOString().split("T")[0],
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
    {
      date: new Date(today.getTime() + 259200000).toISOString().split("T")[0],
      hours: [
        { time: "09:00", windSpeed: 4, windDirection: 270, windGust: 7, temperature: 14.0, humidity: 86 },
        { time: "10:00", windSpeed: 6, windDirection: 270, windGust: 10, temperature: 15.5, humidity: 80 },
        { time: "11:00", windSpeed: 8, windDirection: 270, windGust: 13, temperature: 17.0, humidity: 75 },
        { time: "12:00", windSpeed: 10, windDirection: 270, windGust: 16, temperature: 18.5, humidity: 70 },
        { time: "13:00", windSpeed: 12, windDirection: 270, windGust: 19, temperature: 19.5, humidity: 65 },
        { time: "14:00", windSpeed: 14, windDirection: 270, windGust: 22, temperature: 20.0, humidity: 60 },
        { time: "15:00", windSpeed: 16, windDirection: 270, windGust: 25, temperature: 19.8, humidity: 62 },
        { time: "16:00", windSpeed: 16, windDirection: 270, windGust: 25, temperature: 19.5, humidity: 65 },
        { time: "17:00", windSpeed: 14, windDirection: 270, windGust: 22, temperature: 19.0, humidity: 68 },
        { time: "18:00", windSpeed: 12, windDirection: 270, windGust: 19, temperature: 18.5, humidity: 72 },
        { time: "19:00", windSpeed: 10, windDirection: 270, windGust: 16, temperature: 18.0, humidity: 75 },
        { time: "20:00", windSpeed: 8, windDirection: 270, windGust: 13, temperature: 17.0, humidity: 80 },
        { time: "21:00", windSpeed: 6, windDirection: 270, windGust: 10, temperature: 16.0, humidity: 85 },
      ],
    },
    {
      date: new Date(today.getTime() + 345600000).toISOString().split("T")[0],
      hours: [
        { time: "09:00", windSpeed: 3, windDirection: 225, windGust: 6, temperature: 13.5, humidity: 87 },
        { time: "10:00", windSpeed: 5, windDirection: 225, windGust: 9, temperature: 15.0, humidity: 82 },
        { time: "11:00", windSpeed: 7, windDirection: 225, windGust: 12, temperature: 16.5, humidity: 77 },
        { time: "12:00", windSpeed: 9, windDirection: 225, windGust: 15, temperature: 18.0, humidity: 72 },
        { time: "13:00", windSpeed: 11, windDirection: 225, windGust: 18, temperature: 19.0, humidity: 67 },
        { time: "14:00", windSpeed: 13, windDirection: 225, windGust: 21, temperature: 19.5, humidity: 62 },
        { time: "15:00", windSpeed: 15, windDirection: 225, windGust: 24, temperature: 19.3, humidity: 64 },
        { time: "16:00", windSpeed: 15, windDirection: 225, windGust: 24, temperature: 19.0, humidity: 67 },
        { time: "17:00", windSpeed: 13, windDirection: 225, windGust: 21, temperature: 18.5, humidity: 70 },
        { time: "18:00", windSpeed: 11, windDirection: 225, windGust: 18, temperature: 18.0, humidity: 74 },
        { time: "19:00", windSpeed: 9, windDirection: 225, windGust: 15, temperature: 17.5, humidity: 77 },
        { time: "20:00", windSpeed: 7, windDirection: 225, windGust: 12, temperature: 16.5, humidity: 82 },
        { time: "21:00", windSpeed: 5, windDirection: 225, windGust: 9, temperature: 15.5, humidity: 87 },
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
