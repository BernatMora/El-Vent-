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
      console.error(`Error en la respuesta de Open-Meteo: ${response.status} ${response.statusText}`)
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

// Función de fallback con datos simulados
function getFallbackData(spot: string) {
  // Generar fechas actuales
  const today = new Date()

  // Crear datos horarios (a diferencia de OpenWeatherMap que es cada 3 horas)
  const baseData = [
    {
      date: today.toISOString().split("T")[0],
      hours: [
        {
          time: "09:00",
          windSpeed: 8,
          windDirection: 90,
          windGust: 12,
          temperature: 14.3,
          humidity: 89,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "10:00",
          windSpeed: 10,
          windDirection: 90,
          windGust: 15,
          temperature: 15.4,
          humidity: 82,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "11:00",
          windSpeed: 12,
          windDirection: 90,
          windGust: 18,
          temperature: 17.5,
          humidity: 74,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "12:00",
          windSpeed: 14,
          windDirection: 90,
          windGust: 20,
          temperature: 18.5,
          humidity: 70,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "13:00",
          windSpeed: 15,
          windDirection: 90,
          windGust: 22,
          temperature: 19.4,
          humidity: 66,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "14:00",
          windSpeed: 16,
          windDirection: 90,
          windGust: 24,
          temperature: 20.1,
          humidity: 60,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "15:00",
          windSpeed: 15,
          windDirection: 90,
          windGust: 23,
          temperature: 19.9,
          humidity: 63,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "16:00",
          windSpeed: 14,
          windDirection: 90,
          windGust: 21,
          temperature: 19.3,
          humidity: 67,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "17:00",
          windSpeed: 12,
          windDirection: 90,
          windGust: 18,
          temperature: 18.9,
          humidity: 70,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "18:00",
          windSpeed: 10,
          windDirection: 90,
          windGust: 15,
          temperature: 18.5,
          humidity: 73,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "19:00",
          windSpeed: 8,
          windDirection: 90,
          windGust: 12,
          temperature: 18.0,
          humidity: 76,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "20:00",
          windSpeed: 6,
          windDirection: 90,
          windGust: 9,
          temperature: 17.2,
          humidity: 79,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "21:00",
          windSpeed: 4,
          windDirection: 90,
          windGust: 6,
          temperature: 15.8,
          humidity: 90,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
      ],
    },
    {
      date: new Date(today.getTime() + 86400000).toISOString().split("T")[0],
      hours: [
        {
          time: "09:00",
          windSpeed: 6,
          windDirection: 315,
          windGust: 9,
          temperature: 15.0,
          humidity: 85,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "10:00",
          windSpeed: 8,
          windDirection: 315,
          windGust: 12,
          temperature: 16.2,
          humidity: 80,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "11:00",
          windSpeed: 10,
          windDirection: 45,
          windGust: 15,
          temperature: 17.8,
          humidity: 75,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "12:00",
          windSpeed: 12,
          windDirection: 90,
          windGust: 18,
          temperature: 19.0,
          humidity: 68,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "13:00",
          windSpeed: 14,
          windDirection: 90,
          windGust: 21,
          temperature: 20.2,
          humidity: 62,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "14:00",
          windSpeed: 16,
          windDirection: 90,
          windGust: 24,
          temperature: 21.0,
          humidity: 58,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "15:00",
          windSpeed: 18,
          windDirection: 90,
          windGust: 27,
          temperature: 20.8,
          humidity: 60,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "16:00",
          windSpeed: 18,
          windDirection: 90,
          windGust: 27,
          temperature: 20.0,
          humidity: 65,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "17:00",
          windSpeed: 16,
          windDirection: 90,
          windGust: 24,
          temperature: 19.5,
          humidity: 68,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "18:00",
          windSpeed: 14,
          windDirection: 90,
          windGust: 21,
          temperature: 19.0,
          humidity: 72,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "19:00",
          windSpeed: 12,
          windDirection: 135,
          windGust: 18,
          temperature: 18.5,
          humidity: 75,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "20:00",
          windSpeed: 10,
          windDirection: 135,
          windGust: 15,
          temperature: 17.5,
          humidity: 80,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "21:00",
          windSpeed: 8,
          windDirection: 135,
          windGust: 12,
          temperature: 16.0,
          humidity: 85,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
      ],
    },
    {
      date: new Date(today.getTime() + 172800000).toISOString().split("T")[0],
      hours: [
        {
          time: "09:00",
          windSpeed: 5,
          windDirection: 315,
          windGust: 8,
          temperature: 14.5,
          humidity: 88,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "10:00",
          windSpeed: 7,
          windDirection: 315,
          windGust: 11,
          temperature: 15.8,
          humidity: 82,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "11:00",
          windSpeed: 9,
          windDirection: 45,
          windGust: 14,
          temperature: 17.0,
          humidity: 78,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "12:00",
          windSpeed: 11,
          windDirection: 90,
          windGust: 17,
          temperature: 18.2,
          humidity: 72,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "13:00",
          windSpeed: 13,
          windDirection: 90,
          windGust: 20,
          temperature: 19.5,
          humidity: 65,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "14:00",
          windSpeed: 15,
          windDirection: 90,
          windGust: 23,
          temperature: 20.5,
          humidity: 60,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "15:00",
          windSpeed: 17,
          windDirection: 90,
          windGust: 26,
          temperature: 20.2,
          humidity: 62,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "16:00",
          windSpeed: 17,
          windDirection: 90,
          windGust: 26,
          temperature: 19.8,
          humidity: 65,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "17:00",
          windSpeed: 15,
          windDirection: 90,
          windGust: 23,
          temperature: 19.0,
          humidity: 70,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "18:00",
          windSpeed: 13,
          windDirection: 90,
          windGust: 20,
          temperature: 18.5,
          humidity: 75,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "19:00",
          windSpeed: 11,
          windDirection: 135,
          windGust: 17,
          temperature: 17.8,
          humidity: 80,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "20:00",
          windSpeed: 9,
          windDirection: 135,
          windGust: 14,
          temperature: 16.5,
          humidity: 85,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "21:00",
          windSpeed: 7,
          windDirection: 135,
          windGust: 11,
          temperature: 15.0,
          humidity: 90,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
      ],
    },
    {
      date: new Date(today.getTime() + 259200000).toISOString().split("T")[0],
      hours: [
        {
          time: "09:00",
          windSpeed: 4,
          windDirection: 270,
          windGust: 7,
          temperature: 14.0,
          humidity: 86,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "10:00",
          windSpeed: 6,
          windDirection: 270,
          windGust: 10,
          temperature: 15.5,
          humidity: 80,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "11:00",
          windSpeed: 8,
          windDirection: 270,
          windGust: 13,
          temperature: 17.0,
          humidity: 75,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "12:00",
          windSpeed: 10,
          windDirection: 270,
          windGust: 16,
          temperature: 18.5,
          humidity: 70,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "13:00",
          windSpeed: 12,
          windDirection: 270,
          windGust: 19,
          temperature: 19.5,
          humidity: 65,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "14:00",
          windSpeed: 14,
          windDirection: 270,
          windGust: 22,
          temperature: 20.0,
          humidity: 60,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "15:00",
          windSpeed: 16,
          windDirection: 270,
          windGust: 25,
          temperature: 19.8,
          humidity: 62,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "16:00",
          windSpeed: 16,
          windDirection: 270,
          windGust: 25,
          temperature: 19.5,
          humidity: 65,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "17:00",
          windSpeed: 14,
          windDirection: 270,
          windGust: 22,
          temperature: 19.0,
          humidity: 68,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "18:00",
          windSpeed: 12,
          windDirection: 270,
          windGust: 19,
          temperature: 18.5,
          humidity: 72,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "19:00",
          windSpeed: 10,
          windDirection: 270,
          windGust: 16,
          temperature: 18.0,
          humidity: 75,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "20:00",
          windSpeed: 8,
          windDirection: 270,
          windGust: 13,
          temperature: 17.0,
          humidity: 80,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "21:00",
          windSpeed: 6,
          windDirection: 270,
          windGust: 10,
          temperature: 16.0,
          humidity: 85,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
      ],
    },
    {
      date: new Date(today.getTime() + 345600000).toISOString().split("T")[0],
      hours: [
        {
          time: "09:00",
          windSpeed: 3,
          windDirection: 225,
          windGust: 6,
          temperature: 13.5,
          humidity: 87,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "10:00",
          windSpeed: 5,
          windDirection: 225,
          windGust: 9,
          temperature: 15.0,
          humidity: 82,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "11:00",
          windSpeed: 7,
          windDirection: 225,
          windGust: 12,
          temperature: 16.5,
          humidity: 77,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "12:00",
          windSpeed: 9,
          windDirection: 225,
          windGust: 15,
          temperature: 18.0,
          humidity: 72,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "13:00",
          windSpeed: 11,
          windDirection: 225,
          windGust: 18,
          temperature: 19.0,
          humidity: 67,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "14:00",
          windSpeed: 13,
          windDirection: 225,
          windGust: 21,
          temperature: 19.5,
          humidity: 62,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "15:00",
          windSpeed: 15,
          windDirection: 225,
          windGust: 24,
          temperature: 19.3,
          humidity: 64,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "16:00",
          windSpeed: 15,
          windDirection: 225,
          windGust: 24,
          temperature: 19.0,
          humidity: 67,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "17:00",
          windSpeed: 13,
          windDirection: 225,
          windGust: 21,
          temperature: 18.5,
          humidity: 70,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "18:00",
          windSpeed: 11,
          windDirection: 225,
          windGust: 18,
          temperature: 18.0,
          humidity: 74,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "19:00",
          windSpeed: 9,
          windDirection: 225,
          windGust: 15,
          temperature: 17.5,
          humidity: 77,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "20:00",
          windSpeed: 7,
          windDirection: 225,
          windGust: 12,
          temperature: 16.5,
          humidity: 82,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
        {
          time: "21:00",
          windSpeed: 5,
          windDirection: 225,
          windGust: 9,
          temperature: 15.5,
          humidity: 87,
          weather: "Clear",
          weatherDescription: "Cielo despejado",
          rain: 0,
          clouds: 0,
        },
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
