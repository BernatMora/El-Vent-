# El Vent

Aplicació PWA de predicció meteorològica per a kitesurf a Sant Pere Pescador (Alt Empordà).  
Combina múltiples fonts de dades, calibratge amb l'estació local Davis i recomanacions de mida de cometa.

**[vent-kite.netlify.app](https://vent-kite.netlify.app)**

---

## Funcionalitats

- **Predicció multi-font** — Open-Meteo (principal), Meteocat (oficial Catalunya), WeatherAPI, OpenWeatherMap i fallback simulat
- **Go / No-Go** — indicador instantani basat en rang de vent i direccions preferides de l'usuari
- **Recomanació de cometa** — talla òptima calculada a partir del pes i nivell de l'usuari
- **Gràfics Aquarius** — imatges directes de l'estació Davis de la zona (vent real vs. previsió)
- **Calibratge local** — correcció de prediccions amb mesures reals de l'estació, desades a Supabase
- **Notificacions push** — avís quan s'obre una finestra òptima de vent (via VAPID + Netlify Functions)
- **PWA instal·lable** — funciona a iOS/Android com a app nativa, amb service worker i auto-update

## Spots disponibles

| Spot | Coordenades |
| --- | --- |
| Sant Pere Pescador (default) | 42.1860°N, 3.1050°E |
| Kitesurf Point | 42.1860°N, 3.1050°E |
| La Ballena | 42.1780°N, 3.0900°E |
| Can Martinet | 42.1710°N, 3.0800°E |
| La Rubina | 42.1950°N, 3.1250°E |

## Stack

- **Framework**: Next.js 14 (App Router)
- **UI**: Tailwind CSS + shadcn/ui + Recharts
- **Estat**: Zustand amb persist middleware
- **Base de dades**: Supabase (calibratge + subscripcions push)
- **Deploy**: Netlify + `@netlify/plugin-nextjs`

## Configuració local

```bash
npm install
cp .env.example .env.local
# Omple les variables necessàries (vegeu més avall)
npm run dev
```

### Variables d'entorn

Copia `.env.example` a `.env.local`. Les variables marcades com a **requerides** fan que parts de l'app no funcionin si falten.

| Variable | Necessitat | Descripció |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Requerit | URL del projecte Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Requerit | Anon key de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Recomanat | Per a operacions servidor (bypass RLS) |
| `METEOCAT_API_KEY` | Opcional | Dades oficials de Catalunya (Meteocat) |
| `WEATHER_API_KEY` | Opcional | WeatherAPI.com |
| `OPENWEATHER_API_KEY` | Opcional | OpenWeatherMap |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Push | Clau pública VAPID |
| `VAPID_PRIVATE_KEY` | Push | Clau privada VAPID |
| `VAPID_SUBJECT` | Push | `mailto:…` per a les push |
| `CRON_SECRET` | Push | Protegeix `/api/push/check-windows` |

Per generar les claus VAPID:

```bash
node -e "const wp=require('web-push'); const k=wp.generateVAPIDKeys(); console.log(k);"
```

## Base de dades (Supabase)

Executa els scripts de `scripts/` al SQL Editor de Supabase per crear les taules necessàries.  
Per a les push notifications, consulta [PUSH_NOTIFICATIONS.md](PUSH_NOTIFICATIONS.md).  
Per a la integració de Meteocat, consulta [METEOCAT_INTEGRATION.md](METEOCAT_INTEGRATION.md).

## Deploy a Netlify

El projecte ja té `netlify.toml` i `@netlify/plugin-nextjs` configurat.  
Afegeix les variables d'entorn a **Netlify → Site settings → Environment variables**.

La función programada `netlify/functions/check-wind-windows.ts` s'executa cada hora (06:00–21:00 UTC) per enviar notificacions push quan hi ha finestres de vent òptimes.
