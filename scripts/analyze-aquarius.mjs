// Prototip d'anàlisi de píxels per extreure dades de les imatges del camping.
// Ús:  node scripts/analyze-aquarius.mjs
import sharp from "sharp"
import fs from "fs"
import path from "path"
import os from "os"

const TS = process.env.AQ_TS // si no, baixem amb el ts actual
const BASE = "https://www.campingaquarius.com/meteo/img/"

async function getCurrentTs() {
  const r = await fetch("https://www.campingaquarius.com/rutasTiempos", {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "X-Requested-With": "XMLHttpRequest",
      Referer: "https://www.campingaquarius.com/la-camara-web",
    },
  })
  const txt = (await r.text()).trim()
  const first = txt.split(",")[0]
  const m = first.match(/^[a-z](\d+)\.png$/)
  return m ? m[1] : null
}

async function downloadImage(letter, ts) {
  const url = `${BASE}${letter}${ts}.png`
  const tmp = path.join(os.tmpdir(), `aq-${letter}.png`)
  const buf = Buffer.from(await (await fetch(url, { headers: { Referer: "https://www.campingaquarius.com/la-camara-web" } })).arrayBuffer())
  fs.writeFileSync(tmp, buf)
  return tmp
}

// Detecta colors típics del Davis WeatherLink (teal i taronja)
function isTeal(r, g, b) {
  // teal aprox: r=20-90, g=110-180, b=130-200 amb saturació
  return r < 100 && g > 100 && b > 110 && b > r + 30
}
function isOrange(r, g, b) {
  return r > 200 && g > 100 && g < 180 && b < 80
}

// === Direcció: c.png (160x160, brúixola) ===
async function extractDirection(filePath) {
  const { data, info } = await sharp(filePath).raw().toBuffer({ resolveWithObject: true })
  const W = info.width, H = info.height, C = info.channels
  const cx = W / 2, cy = H / 2
  const minR = Math.min(W, H) / 2
  // Anell on busquem la fletxa: entre 30% i 65% del radi.
  // Excloem la meitat inferior central perquè hi ha el text "64°" (també teal).
  const rMin = minR * 0.30
  const rMax = minR * 0.65
  // Cerquem el píxel teal MÉS LLUNYÀ del centre dins l'anell — punta de la fletxa.
  let bestDist = -1, bestDx = 0, bestDy = 0
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * C
      const r = data[i], g = data[i + 1], b = data[i + 2]
      if (!isTeal(r, g, b)) continue
      const dx = x - cx, dy = y - cy
      const dist = Math.hypot(dx, dy)
      if (dist < rMin || dist > rMax) continue
      // Exclou la franja del text "64°" (banda horitzontal central-baixa)
      const inTextBand = dy > minR * 0.20 && Math.abs(dx) < minR * 0.45
      if (inTextBand) continue
      if (dist > bestDist) { bestDist = dist; bestDx = dx; bestDy = dy }
    }
  }
  if (bestDist < 0) return null
  // angle matemàtic → meteorològic (0=N, 90=E, ...). dy negatiu = nord.
  let deg = Math.atan2(bestDx, -bestDy) * 180 / Math.PI
  if (deg < 0) deg += 360
  return Math.round(deg)
}

// === Velocitat/ratxa: b.png (500x180, gràfic 24h) ===
// La zona del plot està (per inspecció visual) dins de:
//   x: ~28 → ~492 ;  y: ~14 (top, valor max) → ~145 (baseline 0)
// Els labels Y van de 0 fins al múltiple de 4 més proper a la dada més alta.
// Davis renderitza fins a 6 línies (0, 4, 8, 12, 16, 20) o si supera, escala (0,5,10,15,20,25,30) etc.
// Per ara assumim escala fixa coneguda i ho fem flexible: detectem el màxim
// amb la primera/última fila on hi hagi un tick teal a l'eix esquerre.
async function extractWind(filePath) {
  const { data, info } = await sharp(filePath).raw().toBuffer({ resolveWithObject: true })
  const W = info.width, H = info.height, C = info.channels
  // Limits del plot (calibrat sobre 500x180)
  const plotLeft = Math.round(W * 0.06)
  const plotRight = Math.round(W * 0.985)
  const plotTop = Math.round(H * 0.08)
  const plotBottom = Math.round(H * 0.81)

  const px = (x, y) => {
    const i = (y * W + x) * C
    return [data[i], data[i + 1], data[i + 2]]
  }

  // Recorrem columnes de dreta a esquerra fins trobar les primeres ocurrències
  // de teal (vent) i taronja (ratxa). Ens assegurem que tinguin més d'1 píxel
  // (per evitar falsos positius del marc).
  let speedY = null, gustY = null
  for (let x = plotRight; x >= plotLeft && (speedY === null || gustY === null); x--) {
    let tealMatches = []
    let orangeMatches = []
    for (let y = plotTop; y <= plotBottom; y++) {
      const [r, g, b] = px(x, y)
      if (speedY === null && isTeal(r, g, b)) tealMatches.push(y)
      if (gustY === null && isOrange(r, g, b)) orangeMatches.push(y)
    }
    // Davis dibuixa la línia amb antialiasing: agafem la posició mitjana (centre del traç)
    if (speedY === null && tealMatches.length > 0) {
      speedY = tealMatches.reduce((a, b) => a + b, 0) / tealMatches.length
    }
    if (gustY === null && orangeMatches.length > 0) {
      gustY = orangeMatches.reduce((a, b) => a + b, 0) / orangeMatches.length
    }
  }

  // Detectar escala Y: busquem línies horitzontals de la graella (gris molt clar)
  // a la columna x = plotLeft - 4 (zona dels labels). Comptem files on hi ha grid.
  // Alternativa: busquem grid lines per saber el píxel del "0" i del màxim.
  // Aquí, calibrem amb les línies de l'eix:
  //   y=0 (label "20") → plotTop ;  y=180 (label "0") → plotBottom (aprox)
  // Per detectar el "max" intentem llegir tints grocs/línies grises horitzontals
  // que parteixen plotBottom-plotTop en 5 segments iguals (Davis sempre 6 líneas: 0,1,2,3,4,5×step).
  // Sense OCR no podem llegir el text del màxim → el deduïm:
  // Assumim que els valors poden ser steps de 2,4,5,10. Provem en aquest ordre
  // i triem el primer que retorni un valor sensat (<= 80 km/h).
  const px0 = plotBottom
  const px1 = plotTop
  // Davis pinta sempre 6 línies horitzontals (5 steps). Suposem step=4 km/h (max=20)
  // i deixem la conversió flexible: el caller pot sobreescriure si OCR detecta el màxim.
  const ASSUMED_MAX_KMH = Number(process.env.AQ_MAX_KMH || 20)
  const yToKmh = (y) => {
    if (y === null) return null
    return Math.max(0, ASSUMED_MAX_KMH * (px0 - y) / (px0 - px1))
  }

  const speedKmh = yToKmh(speedY)
  const gustKmh = yToKmh(gustY)
  return {
    speedY, gustY,
    speedKmh: speedKmh !== null ? Number(speedKmh.toFixed(1)) : null,
    gustKmh: gustKmh !== null ? Number(gustKmh.toFixed(1)) : null,
    speedKnots: speedKmh !== null ? Math.round(speedKmh / 1.852) : null,
    gustKnots: gustKmh !== null ? Math.round(gustKmh / 1.852) : null,
    plotBox: { plotLeft, plotRight, plotTop, plotBottom },
    assumedMaxKmh: ASSUMED_MAX_KMH,
  }
}

;(async () => {
  const ts = TS || (await getCurrentTs())
  console.log("Timestamp:", ts)
  const bPath = await downloadImage("b", ts)
  const cPath = await downloadImage("c", ts)
  console.log("Direcció (c.png):", await extractDirection(cPath), "°")
  console.log("Vent (b.png):", await extractWind(bPath))
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
