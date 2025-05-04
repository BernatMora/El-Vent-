import type { NextRequest } from "next/server"
import redis, { testRedisConnection } from "@/lib/redis"

// Coordenadas precisas de los spots de kitesurf
const SPOT_COORDINATES: Record<string, { lat: number; lon: number }> = {
  "la-ballena": { lat: 42.1777, lon: 3.1257 }, // Sant Pere Pescador
  "kitesurf-point": { lat: 42.183, lon: 3.124 },
  "can-martinet": { lat: 42.172, lon: 3.127 },
}

export async function GET(request: NextRequest) {
  // Obtener el parámetro spot de la URL
  const searchParams = request.nextUrl.searchParams
  const spot = searchParams.get("spot")

  // Validar el spot
  if (!spot || !SPOT_COORDINATES[spot]) {
    return new Response(JSON.stringify({ error: "Spot no válido" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
    })
  }

  try {
    // Probar la conexión a Redis
    const redisConnected = await testRedisConnection()

    if (redisConnected) {
      // Intentar obtener datos de caché
      const cacheKey = `wind_data_${spot}`
      try {
        const cachedData = await redis.get(cacheKey)

        if (cachedData) {
          console.log("Usando datos en caché para", spot)
          return new Response(JSON.stringify(cachedData), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "X-Data-Source": "cache",
            },
          })
        }
      } catch (cacheError) {
        console.error("Error al obtener datos de caché:", cacheError)
      }
    } else {
      console.log("Redis no está disponible")
    }

    // Si no hay datos en caché o hay un error, obtener datos de OpenWeatherMap
    console.log("Obteniendo datos de OpenWeatherMap para", spot)

    try {
      const weatherData = await getOpenWeatherData(spot)

      // Intentar guardar en caché si Redis está conectado
      if (redisConnected) {
        try {
          const cacheKey = `wind_data_${spot}`
          await redis.set(cacheKey, weatherData, { ex: 1800 }) // Caché de 30 minutos
          console.log("Datos guardados en caché para", spot)
        } catch (cacheError) {
          console.error("Error al guardar datos en caché:", cacheError)
        }
      }

      return new Response(JSON.stringify(weatherData), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-Data-Source": "openweathermap",
        },
      })
    } catch (weatherError) {
      console.error("Error obteniendo datos de OpenWeatherMap:", weatherError)

      // En caso de error con la API, usar datos de fallback
      console.log("Usando datos de fallback para", spot)
      const fallbackData = getFallbackData(spot)

      return new Response(JSON.stringify(fallbackData), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-Data-Source": "fallback",
        },
      })
    }
  } catch (error) {
    console.error("Error procesando solicitud:", error)

    // En caso de error general, usar datos de fallback
    const fallbackData = getFallbackData(spot)

    return new Response(JSON.stringify(fallbackData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Data-Source": "fallback",
      },
    })
  }
}

// Función para obtener datos de OpenWeatherMap
async function getOpenWeatherData(spot: string) {
  const { lat, lon } = SPOT_COORDINATES[spot]
  const apiKey = process.env.OPENWEATHERMAP_API_KEY

  if (!apiKey) {
    throw new Error("API key de OpenWeatherMap no configurada")
  }

  // Obtener previsión de 5 días con datos cada 3 horas
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`

  const response = await fetch(url, { next: { revalidate: 3600 } }) // Revalidar cada hora

  if (!response.ok) {
    throw new Error(`Error en la API de OpenWeatherMap: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()

  // Transformar datos al formato que espera la aplicación
  return transformOpenWeatherData(data)
}

// Función para transformar datos de OpenWeatherMap al formato de la aplicación
function transformOpenWeatherData(data: any) {
  // Verificar que tenemos datos válidos
  if (!data || !data.list || !Array.isArray(data.list) || data.list.length === 0) {
    throw new Error("Datos de OpenWeatherMap inválidos")
  }

  // Agrupar por día
  const dayMap = new Map()

  data.list.forEach((item: any) => {
    // Obtener fecha y hora
    const date = new Date(item.dt * 1000)
    const dateStr = date.toISOString().split("T")[0]
    const hours = date.getHours()
    const timeStr = `${hours.toString().padStart(2, "0")}:00`

    // Solo considerar horas entre 9:00 y 21:00
    if (hours >= 9 && hours <= 21) {
      // Convertir velocidad del viento de m/s a nudos
      const windSpeedMps = item.wind.speed
      const windSpeedKnots = Math.round(windSpeedMps * 1.94384)

      // Convertir ráfagas de viento de m/s a nudos (si están disponibles)
      const windGustMps = item.wind.gust || windSpeedMps * 1.5
      const windGustKnots = Math.round(windGustMps * 1.94384)

      // Crear objeto de hora
      const hourData = {
        time: timeStr,
        windSpeed: windSpeedKnots,
        windDirection: item.wind.deg,
        windGust: windGustKnots,
        temperature: Math.round(item.main.temp * 10) / 10,
        humidity: item.main.humidity,
      }

      // Añadir al mapa de días
      if (!dayMap.has(dateStr)) {
        dayMap.set(dateStr, {
          date: dateStr,
          hours: [],
        })
      }

      dayMap.get(dateStr).hours.push(hourData)
    }
  })

  // Convertir mapa a array y ordenar por fecha
  const result = Array.from(dayMap.values())

  // Ordenar días
  result.sort((a, b) => a.date.localeCompare(b.date))

  // Limitar a 3 días
  const limitedResult = result.slice(0, 3)

  // Si hay menos de 3 días, rellenar con datos simulados
  while (limitedResult.length < 3) {
    const lastDate = limitedResult.length > 0 ? new Date(limitedResult[limitedResult.length - 1].date) : new Date()

    lastDate.setDate(lastDate.getDate() + 1)
    const nextDateStr = lastDate.toISOString().split("T")[0]

    // Crear día simulado
    limitedResult.push({
      date: nextDateStr,
      hours: generateSimulatedHours(),
    })
  }

  // Asegurarse de que cada día tiene todas las horas necesarias
  limitedResult.forEach((day) => {
    ensureAllHours(day)
  })

  return limitedResult
}

// Función para generar horas simuladas
function generateSimulatedHours() {
  const hours = []
  const baseWindSpeed = 5 + Math.random() * 10

  for (let h = 9; h <= 21; h++) {
    // Simular patrón de viento que aumenta durante el día y disminuye por la tarde
    let hourFactor = 1
    if (h >= 12 && h <= 17) {
      hourFactor = 1.5
    }

    const windSpeed = Math.round(baseWindSpeed * hourFactor + Math.random() * 5)
    const windDirection = Math.round(45 + Math.random() * 90) // Dirección entre NE y E

    hours.push({
      time: `${h.toString().padStart(2, "0")}:00`,
      windSpeed: windSpeed,
      windDirection: windDirection,
      windGust: Math.round(windSpeed * (1.2 + Math.random() * 0.5)),
      temperature: Math.round((18 + Math.random() * 8) * 10) / 10,
      humidity: Math.round(60 + Math.random() * 30),
    })
  }

  return hours
}

// Función para asegurar que un día tiene todas las horas de 9:00 a 21:00
function ensureAllHours(day: any) {
  const requiredHours = Array.from({ length: 13 }, (_, i) => `${(i + 9).toString().padStart(2, "0")}:00`)
  const existingHours = new Set(day.hours.map((h: any) => h.time))

  // Añadir horas faltantes
  for (const time of requiredHours) {
    if (!existingHours.has(time)) {
      // Encontrar horas cercanas para interpolar
      const hour = Number.parseInt(time.split(":")[0])
      let prevHour = null
      let nextHour = null

      for (let i = 1; i <= 3; i++) {
        const prevTime = `${(hour - i).toString().padStart(2, "0")}:00`
        const nextTime = `${(hour + i).toString().padStart(2, "0")}:00`

        const prev = day.hours.find((h: any) => h.time === prevTime)
        const next = day.hours.find((h: any) => h.time === nextTime)

        if (prev && !prevHour) prevHour = prev
        if (next && !nextHour) nextHour = next

        if (prevHour && nextHour) break
      }

      // Si tenemos horas cercanas, interpolar
      if (prevHour && nextHour) {
        const prevHourNum = Number.parseInt(prevHour.time.split(":")[0])
        const nextHourNum = Number.parseInt(nextHour.time.split(":")[0])
        const totalDiff = nextHourNum - prevHourNum
        const currentDiff = hour - prevHourNum
        const factor = currentDiff / totalDiff

        day.hours.push({
          time,
          windSpeed: Math.round(prevHour.windSpeed + (nextHour.windSpeed - prevHour.windSpeed) * factor),
          windDirection: Math.round(
            prevHour.windDirection + (nextHour.windDirection - prevHour.windDirection) * factor,
          ),
          windGust: Math.round(prevHour.windGust + (nextHour.windGust - prevHour.windGust) * factor),
          temperature:
            Math.round((prevHour.temperature + (nextHour.temperature - prevHour.temperature) * factor) * 10) / 10,
          humidity: Math.round(prevHour.humidity + (nextHour.humidity - prevHour.humidity) * factor),
        })
      } else {
        // Si no podemos interpolar, generar datos aleatorios
        const baseHour = day.hours.length > 0 ? day.hours[0] : null
        const baseWindSpeed = baseHour ? baseHour.windSpeed : 10
        const baseWindDir = baseHour ? baseHour.windDirection : 90

        day.hours.push({
          time,
          windSpeed: Math.round(baseWindSpeed * (0.8 + Math.random() * 0.4)),
          windDirection: Math.round(baseWindDir + (Math.random() * 20 - 10)),
          windGust: Math.round(baseWindSpeed * (1.2 + Math.random() * 0.5)),
          temperature: baseHour ? baseHour.temperature : 20,
          humidity: baseHour ? baseHour.humidity : 70,
        })
      }
    }
  }

  // Ordenar horas
  day.hours.sort((a: any, b: any) => a.time.localeCompare(b.time))
}

// Función de fallback con datos simulados (mantener como respaldo)
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

  if (spot === "kitesurf-point") {
    // Kitesurf Point tiene vientos ligeramente más fuertes y más constantes
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
  } else if (spot === "can-martinet") {
    // Can Martinet tiene vientos ligeramente más débiles pero más constantes
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
