import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day)
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

// Sant Pere Pescador: la platja mira a Est/SE. Onshore = E/SE, Side-shore = NE/S, Offshore = W/NW/N/SW
export function getShoreType(direction: number): { label: string; color: string; emoji: string } {
  // Onshore: vent que ve del mar (E, SE)
  if (direction >= 67.5 && direction < 157.5) {
    return { label: "Onshore", color: "text-green-700 bg-green-50 border-green-200", emoji: "🟢" }
  }
  // Side-shore: vent lateral (NE, S)
  if ((direction >= 22.5 && direction < 67.5) || (direction >= 157.5 && direction < 202.5)) {
    return { label: "Side", color: "text-amber-700 bg-amber-50 border-amber-200", emoji: "🟡" }
  }
  // Offshore: vent de terra (W, NW, N, SW)
  return { label: "Offshore", color: "text-red-700 bg-red-50 border-red-200", emoji: "🔴" }
}
