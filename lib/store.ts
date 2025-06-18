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
}

export const useSpotStore = create<SpotStore>((set) => ({
  selectedSpot: "kitesurf-point", // Canviat de "la-ballena" a "kitesurf-point"
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
  setSelectedSpot: (spot) => set({ selectedSpot: spot }),
  setUserPreferences: (preferences) => set({ userPreferences: preferences }),
}))