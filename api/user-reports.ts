import type { NextApiRequest, NextApiResponse } from "next"
import { Redis } from "@upstash/redis"

// Inicializar Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL || "",
  token: process.env.UPSTASH_REDIS_TOKEN || "",
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Habilitar CORS
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  // Manejar preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end()
  }

  const { spot } = req.query as { spot: string }

  if (!spot) {
    return res.status(400).json({ error: "Spot no válido" })
  }

  // Clave para almacenar reportes de usuarios
  const reportsKey = `user_reports_${spot}`

  if (req.method === "GET") {
    try {
      // Obtener reportes existentes
      const reports = await redis.get(reportsKey)
      return res.status(200).json(reports ? JSON.parse(reports as string) : [])
    } catch (error) {
      console.error("Error obteniendo reportes:", error)
      return res.status(500).json({ error: "Error obteniendo reportes de usuarios" })
    }
  } else if (req.method === "POST") {
    try {
      // Validar datos del reporte
      const { windSpeed, windDirection, comment, user } = req.body

      if (!windSpeed || !windDirection) {
        return res.status(400).json({ error: "Datos de viento requeridos" })
      }

      // Crear nuevo reporte
      const newReport = {
        id: Date.now(),
        user: user || "Anónimo",
        time: new Date().toISOString(),
        windSpeed: Number(windSpeed),
        windDirection,
        comment: comment || "",
        spot,
      }

      // Obtener reportes existentes
      const existingReports = await redis.get(reportsKey)
      const reports = existingReports ? JSON.parse(existingReports as string) : []

      // Añadir nuevo reporte al principio
      reports.unshift(newReport)

      // Limitar a los 20 reportes más recientes
      const limitedReports = reports.slice(0, 20)

      // Guardar reportes actualizados
      await redis.set(reportsKey, JSON.stringify(limitedReports))

      return res.status(201).json(newReport)
    } catch (error) {
      console.error("Error guardando reporte:", error)
      return res.status(500).json({ error: "Error guardando reporte de usuario" })
    }
  } else {
    return res.status(405).json({ error: "Método no permitido" })
  }
}
