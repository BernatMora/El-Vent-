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
      throw new Error("API key de OpenWeatherMap no configurada")
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
      throw new Error(`Error en la respuesta de OpenWeatherMap: ${response.status} ${response.statusText}`)
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

    // En caso de error, devolver el error para que sea visible
    return new Response(
      JSON.stringify({
        error: "Error al obtener datos de OpenWeatherMap",
        message: error instanceof Error ? error.message : "Error desconocido",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    )
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
