// Coordenades centralitzades dels spots de kitesurf a Sant Pere Pescador
export const SPOT_COORDINATES: Record<string, { lat: number; lon: number }> = {
  "kitesurf-point": { lat: 42.1860, lon: 3.1050 },
  "la-ballena":     { lat: 42.1780, lon: 3.0900 },
  "can-martinet":   { lat: 42.1710, lon: 3.0800 },
  "la-rubina":      { lat: 42.1950, lon: 3.1250 },
}

export const DEFAULT_SPOT = "kitesurf-point"
export const VALID_SPOTS = new Set(Object.keys(SPOT_COORDINATES))
export const DEFAULT_COORDS = SPOT_COORDINATES[DEFAULT_SPOT]

export function getSpotCoords(spot?: string) {
  return (spot && SPOT_COORDINATES[spot]) || DEFAULT_COORDS
}
