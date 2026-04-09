import { create } from "zustand"

type UserPreferences = {
  weight: number
  level: string
  windSpeed?: {
    min: number
    max: number
  }
  windDirection?: string[]
  considerTemperature?: boolean
  minTemperature?: number
  considerWaves?: boolean
  maxWaveHeight?: number
}

type SpotStore = {
  selectedSpot: string
  userPreferences: UserPreferences
  setSelectedSpot: (spot: string) => void
  setUserPreferences: (preferences: UserPreferences) => void
  hydrateStore: () => void
}

const DEFAULT_SPOT = "kitesurf-point"
const VALID_SPOTS = new Set([DEFAULT_SPOT, "la-ballena", "can-martinet", "la-rubina"])

function getStoredSpot() {
  if (typeof window === "undefined") {
    return DEFAULT_SPOT
  }

  const storedSpot = window.localStorage.getItem("selected-spot")
  return storedSpot && VALID_SPOTS.has(storedSpot) ? storedSpot : DEFAULT_SPOT
}

export const useSpotStore = create<SpotStore>((set) => ({
  selectedSpot: DEFAULT_SPOT,
  userPreferences: {
    weight: 75,
    level: "intermediate",
    windSpeed: {
      min: 10,
      max: 20,
    },
    windDirection: ["E", "SE", "NE"],
    considerTemperature: true,
    minTemperature: 18,
    considerWaves: true,
    maxWaveHeight: 1.5,
  },
  setSelectedSpot: (spot) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("selected-spot", spot)
    }
    set({ selectedSpot: spot })
  },
  setUserPreferences: (preferences) => set({ userPreferences: preferences }),
  hydrateStore: () => set({ selectedSpot: getStoredSpot() }),
}))