import { create } from "zustand"
import { persist } from "zustand/middleware"
import { DEFAULT_SPOT, VALID_SPOTS } from "./spot-coordinates"

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

const DEFAULT_PREFERENCES: UserPreferences = {
  weight: 75,
  level: "intermediate",
  windSpeed: { min: 10, max: 20 },
  windDirection: ["E", "SE", "NE"],
  considerTemperature: true,
  minTemperature: 18,
  considerWaves: true,
  maxWaveHeight: 1.5,
}

export const useSpotStore = create<SpotStore>()(
  persist(
    (set) => ({
      selectedSpot: DEFAULT_SPOT,
      userPreferences: DEFAULT_PREFERENCES,
      setSelectedSpot: (spot) => {
        if (VALID_SPOTS.has(spot)) set({ selectedSpot: spot })
      },
      setUserPreferences: (preferences) => set({ userPreferences: preferences }),
    }),
    {
      name: "el-vent-store",
      partialize: (state) => ({
        selectedSpot: state.selectedSpot,
        userPreferences: state.userPreferences,
      }),
    }
  )
)
