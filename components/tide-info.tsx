"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Waves, ArrowUp, ArrowDown, Clock } from "lucide-react"

interface TideData {
  currentLevel: "alta" | "baixa" | "pujant" | "baixant"
  currentHeight: number // metres
  nextHighTide: string // hora
  nextLowTide: string // hora
  tidePercent: number // 0-100, on 100 és marea alta
}

// Simulació de marees basada en cicles lunars (aproximació)
// A la Mediterrània les marees són molt petites (20-30cm)
function calculateTideData(): TideData {
  const now = new Date()
  const hours = now.getHours()
  const minutes = now.getMinutes()
  const totalMinutes = hours * 60 + minutes
  
  // Cicle de marea aproximat de 12h 25min (745 minuts)
  const tideCycle = 745
  const cyclePosition = totalMinutes % tideCycle
  const tidePercent = Math.round(50 + 50 * Math.sin((cyclePosition / tideCycle) * 2 * Math.PI))
  
  // Altura de marea (Mediterrània: 0.1m - 0.3m)
  const currentHeight = 0.1 + (tidePercent / 100) * 0.2
  
  // Determinar estat de la marea
  let currentLevel: TideData["currentLevel"]
  if (tidePercent > 85) {
    currentLevel = "alta"
  } else if (tidePercent < 15) {
    currentLevel = "baixa"
  } else if (cyclePosition < tideCycle / 2) {
    currentLevel = "pujant"
  } else {
    currentLevel = "baixant"
  }
  
  // Calcular properes marees
  const minutesToNextHigh = cyclePosition < tideCycle / 4 
    ? Math.round(tideCycle / 4 - cyclePosition)
    : Math.round(tideCycle * 5 / 4 - cyclePosition)
  
  const minutesToNextLow = cyclePosition < tideCycle * 3 / 4
    ? Math.round(tideCycle * 3 / 4 - cyclePosition)
    : Math.round(tideCycle * 7 / 4 - cyclePosition)
  
  const nextHighTime = new Date(now.getTime() + minutesToNextHigh * 60000)
  const nextLowTime = new Date(now.getTime() + minutesToNextLow * 60000)
  
  return {
    currentLevel,
    currentHeight: Math.round(currentHeight * 100) / 100,
    nextHighTide: `${nextHighTime.getHours().toString().padStart(2, '0')}:${nextHighTime.getMinutes().toString().padStart(2, '0')}`,
    nextLowTide: `${nextLowTime.getHours().toString().padStart(2, '0')}:${nextLowTime.getMinutes().toString().padStart(2, '0')}`,
    tidePercent
  }
}

const levelLabels = {
  alta: "Marea alta",
  baixa: "Marea baixa", 
  pujant: "Marea pujant",
  baixant: "Marea baixant"
}

const levelColors = {
  alta: "text-blue-600 bg-blue-50",
  baixa: "text-amber-600 bg-amber-50",
  pujant: "text-cyan-600 bg-cyan-50",
  baixant: "text-slate-600 bg-slate-50"
}

export function TideInfo() {
  const [tideData, setTideData] = useState<TideData | null>(null)
  
  useEffect(() => {
    setTideData(calculateTideData())
    
    // Actualitzar cada 5 minuts
    const interval = setInterval(() => {
      setTideData(calculateTideData())
    }, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])
  
  if (!tideData) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="h-20 animate-pulse rounded bg-slate-100" />
        </CardContent>
      </Card>
    )
  }
  
  const LevelIcon = tideData.currentLevel === "pujant" || tideData.currentLevel === "alta" 
    ? ArrowUp 
    : ArrowDown

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Waves className="h-4 w-4 text-blue-500" />
          Marees
        </CardTitle>
        <CardDescription className="text-xs">
          Mediterrània · Variació petita (20-30 cm)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className={`flex items-center justify-between rounded-lg p-3 ${levelColors[tideData.currentLevel]}`}>
          <div className="flex items-center gap-2">
            <LevelIcon className="h-5 w-5" />
            <span className="font-medium">{levelLabels[tideData.currentLevel]}</span>
          </div>
          <span className="text-sm font-semibold">{tideData.currentHeight} m</span>
        </div>
        
        {/* Barra visual del nivell de marea */}
        <div className="relative h-2 overflow-hidden rounded-full bg-slate-200">
          <div 
            className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
            style={{ width: `${tideData.tidePercent}%` }}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5 rounded-md bg-slate-50 p-2">
            <Clock className="h-3.5 w-3.5 text-blue-500" />
            <div>
              <div className="text-slate-500">Propera alta</div>
              <div className="font-medium">{tideData.nextHighTide}</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-md bg-slate-50 p-2">
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            <div>
              <div className="text-slate-500">Propera baixa</div>
              <div className="font-medium">{tideData.nextLowTide}</div>
            </div>
          </div>
        </div>
        
        <p className="text-[10px] leading-relaxed text-slate-400">
          A Sant Pere les marees tenen poc impacte, però amb marea baixa hi ha més zona de sorra.
        </p>
      </CardContent>
    </Card>
  )
}
