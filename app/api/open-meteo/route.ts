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

    // Construir la URL de la API de Open-Meteo con parámetros para forzar datos actuales
    // Añadimos past_days=1 para asegurar que tenemos datos del día actual
    // Añadimos un timestamp aleatorio para evitar caché
    const randomParam = Math.random().toString(36).substring(7)
    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relativehumidity_2m,precipitation,weathercode,windspeed_10m,winddirection_10m,windgusts_10m&windspeed_unit=kn&timezone=Europe/Madrid&forecast_days=5&past_days=0&timeformat=unixtime&nocache=${randomParam}`

    console.log("Llamando a Open-Meteo API para", spot, "con timestamp:", timestamp)

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
      throw new Error(`Error en la respuesta de Open-Meteo: ${response.status} ${response.statusText}`)
    }

    // Obtener los datos de la API
    const weatherData = await response.json()

    // Transformar los datos al formato que espera nuestra aplicación
    const formattedData = transformOpenMeteoData(weatherData)

    return new Response(JSON.stringify(formattedData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Data-Source": "open-meteo",
        "X-Timestamp": timestamp,
        "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error) {
    console.error("Error procesando solicitud de Open-Meteo:", error)

    // En caso de error, devolver el error para que sea visible
    return new Response(
      JSON.stringify({
        error: "Error al obtener datos de Open-Meteo",
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

// Función para transformar los datos de Open-Meteo al formato que espera nuestra aplicación
function transformOpenMeteoData(weatherData: any) {
  // Agrupar los datos por día
  const groupedByDay: Record<string, any[]> = {}

  // Obtener los arrays de datos
  const {
    time,
    temperature_2m,
    relativehumidity_2m,
    precipitation,
    weathercode,
    windspeed_10m,
    winddirection_10m,
    windgusts_10m,
  } = weatherData.hourly

  // Procesar cada punto de tiempo
  for (let i = 0; i < time.length; i++) {
    // Convertir timestamp a fecha
    const date = new Date(time[i] * 1000) // Convertir de Unix timestamp a milisegundos
    const dateStr = date.toISOString().split("T")[0]

    // Inicializar el array para este día si no existe
    if (!groupedByDay[dateStr]) {
      groupedByDay[dateStr] = []
    }

    // Extraer la hora en formato HH:MM
    const hours = date.getHours().toString().padStart(2, "0")
    const minutes = date.getMinutes().toString().padStart(2, "0")
    const timeStr = `${hours}:${minutes}`

    // Mapear el código de clima de Open-Meteo a un formato más amigable
    const weather = getWeatherFromCode(weathercode[i])

    // Añadir los datos formateados
    groupedByDay[dateStr].push({
      time: timeStr,
      windSpeed: Math.round(windspeed_10m[i]), // Ya viene en nudos según la API
      windDirection: winddirection_10m[i],
      windGust: Math.round(windgusts_10m[i]), // Ya viene en nudos según la API
      temperature: Math.round(temperature_2m[i] * 10) / 10,
      humidity: relativehumidity_2m[i],
      weather: weather.main,
      weatherDescription: weather.description,
      rain: precipitation[i],
      clouds: 0, // Open-Meteo no proporciona cobertura de nubes directamente
    })
  }

  // Convertir el objeto agrupado a un array de días
  const result = Object.keys(groupedByDay).map((dateStr) => ({
    date: dateStr,
    hours: groupedByDay[dateStr],
  }))

  // Ordenar por fecha
  result.sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime()
  })

  // Limitar a 5 días exactamente
  return result.slice(0, 5)
}

// Función para mapear códigos de clima de Open-Meteo a descripciones
function getWeatherFromCode(code: number) {
  // Códigos de clima según la documentación de Open-Meteo
  // https://open-meteo.com/en/docs
  switch (code) {
    case 0:
      return { main: "Clear", description: "Cielo despejado" }
    case 1:
      return { main: "Clear", description: "Mayormente despejado" }
    case 2:
      return { main: "Clouds", description: "Parcialmente nublado" }
    case 3:
      return { main: "Clouds", description: "Nublado" }
    case 45:
    case 48:
      return { main: "Fog", description: "Niebla" }
    case 51:
    case 53:
    case 55:
      return { main: "Rain", description: "Llovizna" }
    case 56:
    case 57:
      return { main: "Rain", description: "Llovizna helada" }
    case 61:
    case 63:
    case 65:
      return { main: "Rain", description: "Lluvia" }
    case 66:
    case 67:
      return { main: "Rain", description: "Lluvia helada" }
    case 71:
    case 73:
    case 75:
      return { main: "Snow", description: "Nieve" }
    case 77:
      return { main: "Snow", description: "Copos de nieve" }
    case 80:
    case 81:
    case 82:
      return { main: "Rain", description: "Chubascos" }
    case 85:
      return { main: "Snow", description: "Chubascos de nieve" }
    case 95:
      return { main: "Thunderstorm", description: "Tormenta" }
    case 96:
    case 99:
      return { main: "Thunderstorm", description: "Tormenta con granizo" }
    default:
      return { main: "Unknown", description: "Desconocido" }
  }
}
