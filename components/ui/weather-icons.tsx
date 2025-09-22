"use client"

import { Cloud, CloudRain, CloudSnow, Sun, Zap } from "lucide-react"

interface WeatherIconProps {
  type: 'none' | 'rain' | 'drizzle' | 'thunderstorm' | 'snow'
  probability: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function WeatherIcon({ type, probability, size = 'md', className = '' }: WeatherIconProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5', 
    lg: 'h-6 w-6'
  }

  const iconSize = sizeClasses[size]

  // Si la probabilitat és baixa, mostrar sol
  if (probability < 20) {
    return <Sun className={`${iconSize} text-yellow-500 ${className}`} />
  }

  // Seleccionar icona segons el tipus
  switch (type) {
    case 'thunderstorm':
      return <Zap className={`${iconSize} text-red-500 ${className}`} />
    case 'rain':
      return <CloudRain className={`${iconSize} text-blue-500 ${className}`} />
    case 'drizzle':
      return <CloudRain className={`${iconSize} text-blue-400 ${className}`} />
    case 'snow':
      return <CloudSnow className={`${iconSize} text-blue-300 ${className}`} />
    default:
      if (probability > 50) {
        return <Cloud className={`${iconSize} text-gray-500 ${className}`} />
      }
      return <Sun className={`${iconSize} text-yellow-500 ${className}`} />
  }
}

export function getPrecipitationEmoji(type: 'none' | 'rain' | 'drizzle' | 'thunderstorm' | 'snow', probability: number): string {
  if (probability < 20) return '☀️'
  
  switch (type) {
    case 'thunderstorm': return '⛈️'
    case 'rain': return '🌧️'
    case 'drizzle': return '🌦️'
    case 'snow': return '❄️'
    default: return probability > 50 ? '☁️' : '🌤️'
  }
}

export function getPrecipitationDescription(type: 'none' | 'rain' | 'drizzle' | 'thunderstorm' | 'snow', probability: number, amount: number): string {
  if (probability < 10) return 'Sense pluja'
  if (probability < 30) return 'Pluja poc probable'
  if (probability < 60) return 'Possible pluja'
  
  let description = ''
  switch (type) {
    case 'thunderstorm': description = 'Tempesta'; break
    case 'rain': description = 'Pluja'; break
    case 'drizzle': description = 'Plugim'; break
    case 'snow': description = 'Neu'; break
    default: description = 'Precipitació'
  }
  
  if (amount > 0) {
    if (amount < 1) description += ' lleugera'
    else if (amount < 5) description += ' moderada'
    else description += ' forta'
  }
  
  return description
}