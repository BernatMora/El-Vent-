// Función para obtener datos de pronóstico
export async function getForecastData(spot: string, source = "openweathermap") {
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
    const randomParam = Math.random().toString(36).substring(7) // Parámetro aleatorio adicional

    // Seleccionar la API según la fuente solicitada
    const apiUrl =
      source === "open-meteo"
        ? `/api/open-meteo?spot=${encodeURIComponent(spot)}&_t=${timestamp}&nocache=${randomParam}`
        : `/api/wind-data?spot=${encodeURIComponent(spot)}&_t=${timestamp}&nocache=${randomParam}`

    console.log(`Llamando a API (${source}):`, apiUrl)

    // Intentar obtener datos del backend con opciones para evitar caché
    const response = await fetch(apiUrl, {
      method: "GET",
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      },
      next: { revalidate: 0 },
    })

    // Verificar si la respuesta contiene datos para el día actual
    if (response.ok) {
      const dataSource = response.headers.get("X-Data-Source")
      console.log(`Fuente de datos: ${dataSource}`)
    }

    if (!response.ok) {
      throw new Error(`Error al obtener datos: ${response.status} ${response.statusText}`)
    }

    // Intentar analizar la respuesta como JSON con manejo de errores mejorado
    let data
    try {
      const text = await response.text()
      data = JSON.parse(text)

      // Guardar timestamp de la última actualización
      if (typeof window !== "undefined") {
        localStorage.setItem("lastDataRefresh", new Date().getTime().toString())
        localStorage.setItem("dataSource", source)
      }

      console.log("Datos procesados correctamente")
      return data
    } catch (parseError) {
      console.error("Error al analizar JSON:", parseError)
      throw new Error("La respuesta no es un JSON válido")
    }
  } catch (error) {
    console.error("Error obteniendo datos de pronóstico:", error)
    throw error // Propagar el error para que sea visible en la UI
  }
}
