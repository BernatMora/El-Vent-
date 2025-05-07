import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Función completamente reescrita para formatear fechas en catalán
export function formatDate(dateString: string) {
  try {
    // Crear un objeto Date a partir del string
    const date = new Date(dateString)

    // Verificar que la fecha es válida
    if (isNaN(date.getTime())) {
      console.error("Fecha inválida:", dateString)
      return dateString
    }

    // Nombres de los días de la semana en catalán
    const weekdays = ["diumenge", "dilluns", "dimarts", "dimecres", "dijous", "divendres", "dissabte"]

    // Nombres de los meses en catalán
    const months = [
      "gener",
      "febrer",
      "març",
      "abril",
      "maig",
      "juny",
      "juliol",
      "agost",
      "setembre",
      "octubre",
      "novembre",
      "desembre",
    ]

    // Obtener componentes de la fecha
    const weekday = weekdays[date.getDay()]
    const day = date.getDate()
    const month = months[date.getMonth()]

    // Formatear la fecha en catalán: "dilluns, 6 de maig"
    return `${weekday}, ${day} de ${month}`
  } catch (error) {
    console.error("Error al formatear fecha:", error)
    return dateString
  }
}

// Función auxiliar para determinar si una fecha es hoy o mañana
export function getRelativeDay(dateString: string) {
  try {
    const date = new Date(dateString)
    const today = new Date()

    // Normalizar las fechas (eliminar horas, minutos, segundos)
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())

    // Crear mañana
    const normalizedTomorrow = new Date(normalizedToday)
    normalizedTomorrow.setDate(normalizedToday.getDate() + 1)

    // Comparar fechas
    if (normalizedDate.getTime() === normalizedToday.getTime()) {
      return "Avui"
    } else if (normalizedDate.getTime() === normalizedTomorrow.getTime()) {
      return "Demà"
    } else {
      return formatDate(dateString)
    }
  } catch (error) {
    console.error("Error al determinar día relativo:", error)
    return formatDate(dateString)
  }
}

// Función para depurar fechas
export function debugDate(dateString: string) {
  try {
    const date = new Date(dateString)
    const today = new Date()

    console.log("Debug fecha:", {
      input: dateString,
      parsed: date.toString(),
      today: today.toString(),
      isToday: date.toDateString() === today.toDateString(),
      dateObj: {
        year: date.getFullYear(),
        month: date.getMonth(),
        day: date.getDate(),
      },
      todayObj: {
        year: today.getFullYear(),
        month: today.getMonth(),
        day: today.getDate(),
      },
    })

    return dateString
  } catch (error) {
    console.error("Error al depurar fecha:", error)
    return dateString
  }
}
