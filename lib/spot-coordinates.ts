// Coordenades centralitzades dels spots de kitesurf a Sant Pere Pescador
export const SPOT_COORDINATES: Record<string, { lat: number; lon: number }> = {
  "kitesurf-point": { lat: 42.1833, lon: 3.0833 },
  "la-ballena":     { lat: 42.1830, lon: 3.0835 },
  "can-martinet":   { lat: 42.1825, lon: 3.0840 },
  "la-rubina":      { lat: 42.1900, lon: 3.1200 },
}

export const DEFAULT_COORDS = SPOT_COORDINATES["kitesurf-point"]

export function getSpotCoords(spot?: string) {
  return (spot && SPOT_COORDINATES[spot]) || DEFAULT_COORDS
}
