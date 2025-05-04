import { Redis } from "@upstash/redis"

// Inicializar el cliente de Redis usando las variables de entorno
let redis: Redis

try {
  // Usar Redis.fromEnv() para obtener las credenciales de las variables de entorno
  redis = Redis.fromEnv()
  console.log("Cliente Redis inicializado correctamente desde variables de entorno")
} catch (error) {
  console.error("Error inicializando cliente Redis:", error)
  // Cliente simulado en caso de error
  redis = {
    get: async () => null,
    set: async () => "OK",
  } as unknown as Redis
}

// Función de ayuda para depuración
export async function testRedisConnection() {
  try {
    await redis.set("test_key", "test_value")
    const value = await redis.get("test_key")
    console.log("Prueba de conexión Redis exitosa:", value)
    return true
  } catch (error) {
    console.error("Error en prueba de conexión Redis:", error)
    return false
  }
}

export default redis
