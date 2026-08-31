// Tests de detectScaleByLabels: lectura d'escala de l'eix Y del Davis
// amb el PNG real del camping (0-40) i un sintetic 0-30.
import { describe, it, expect } from "vitest"
import sharp from "sharp"
import fs from "fs"
import path from "path"
import { detectScaleByLabels } from "@/lib/aquarius-service"

const FIXTURE = path.join(__dirname, "fixtures", "aquarius-b.png")

async function raw(file: string) {
  const buf = fs.readFileSync(file)
  return sharp(buf).raw().toBuffer({ resolveWithObject: true })
}

describe("detectScaleByLabels", () => {
  it("llegeix 40 km/h al PNG real del Davis (0-40, etiquetes 0..40)", async () => {
    const { data, info } = await raw(FIXTURE)
    const r = detectScaleByLabels(data, info.width, info.height, info.channels)
    expect(r).not.toBeNull()
    expect(r!.maxKmh).toBe(40)
    // anclatge: yMax (etiqueta 40) per sobre de yZero (etiqueta 0)
    expect(r!.yMax).toBeLessThan(r!.yZero)
    // espaiat 0-40 coherent: 4 intervals ~30px
    expect(r!.yZero - r!.yMax).toBeGreaterThan(100)
  })

  it("llegeix 30 km/h en un grafic sintetic auto-escalat (0-30)", async () => {
    // sintetic 500x180 com l'original: etiquetes 0,10,20,30 a la franja esquerra
    const W = 500, H = 180, C = 3
    const px = Buffer.alloc(W * H * C, 255)
    const labelRows = [26, 56, 86, 116] // 30, 20, 10, 0
    for (const y of labelRows) {
      for (const yy of [y - 2, y - 1, y, y + 1, y + 2]) {
        for (let x = 27; x < 42; x++) {
          const i = (yy * W + x) * C
          px[i] = px[i + 1] = px[i + 2] = 140 // text gris
        }
      }
    }
    const r = detectScaleByLabels(px, W, H, C)
    expect(r).not.toBeNull()
    expect(r!.maxKmh).toBe(30)
    expect(r!.yZero).toBe(116)
    expect(r!.yMax).toBe(26)
  })

  it("retorna null sense etiquetes (graf buit)", async () => {
    const W = 500, H = 180, C = 3
    const px = Buffer.alloc(W * H * C, 255)
    const r = detectScaleByLabels(px, W, H, C)
    expect(r).toBeNull()
  })
})