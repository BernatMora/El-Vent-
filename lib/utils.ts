import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString("ca-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
}

export function getWindDirectionName(direction: number) {
  if (direction >= 337.5 || direction < 22.5) return "N"
  if (direction >= 22.5 && direction < 67.5) return "NE"
  if (direction >= 67.5 && direction < 112.5) return "E"
  if (direction >= 112.5 && direction < 157.5) return "SE"
  if (direction >= 157.5 && direction < 202.5) return "S"
  if (direction >= 202.5 && direction < 247.5) return "SW"
  if (direction >= 247.5 && direction < 292.5) return "W"
  return "NW"
}

export function getWindName(direction: number) {
  if (direction >= 337.5 || direction < 22.5) return "Tramuntana"
  if (direction >= 22.5 && direction < 67.5) return "Gregal"
  if (direction >= 67.5 && direction < 112.5) return "Llevant"
  if (direction >= 112.5 && direction < 157.5) return "Xaloc"
  if (direction >= 157.5 && direction < 202.5) return "Migjorn"
  if (direction >= 202.5 && direction < 247.5) return "Llebeig"
  if (direction >= 247.5 && direction < 292.5) return "Ponent"
  if (direction >= 292.5 && direction < 337.5) return "Mestral"
  return "Tramuntana"
}

export function knotsToKmh(knots: number) {
  return Math.round(knots * 1.852)
}
