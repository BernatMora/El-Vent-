# Push notifications — guia de configuració

L'app envia notificacions push als usuaris subscrits quan detecta finestres
òptimes per navegar en les pròximes hores/dies.

## 1. Variables d'entorn (Netlify)

Generar claus VAPID localment:

```powershell
node -e "const wp=require('web-push'); const k=wp.generateVAPIDKeys(); console.log(k);"
```

Afegir a Netlify (Site settings → Environment variables):

| Variable | Descripció |
|----------|------------|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Clau pública VAPID (visible al client) |
| `VAPID_PRIVATE_KEY` | Clau privada VAPID (només servidor) |
| `VAPID_SUBJECT` | (opcional) `mailto:tu@email.com` |
| `CRON_SECRET` | Token aleatori que protegeix `/api/push/check-windows` |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del projecte Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key |

## 2. Crear taules a Supabase

Executar `scripts/003_create_push_subscriptions.sql` al SQL Editor de Supabase.

## 3. Comprovar la scheduled function

`netlify/functions/check-wind-windows.ts` s'executa cada hora entre 06:00-21:00 UTC.
Es pot disparar manualment a Netlify → Functions → Run.

També es pot fer manualment amb:

```powershell
curl -X POST https://vent-kite.netlify.app/api/push/check-windows -H "x-cron-secret: TEU_SECRET"
```

## 4. Flux

1. Usuari activa notificacions a la UI → `subscribeToPush(prefs)`
2. Subscriptor es desa a `push_subscriptions`
3. Cada hora, la scheduled function crida `/api/push/check-windows`
4. L'endpoint llegeix les subscripcions, calcula finestres òptimes per spot,
   i envia push als usuaris (un per finestra, evitant duplicats via
   `push_notifications_log`)
5. Si l'endpoint torna `410 Gone`, la subscripció s'esborra automàticament

## 5. Local testing

`.env.local` ha de tenir totes les vars VAPID + Supabase. Llavors:

```powershell
npm run dev
# en una altra terminal:
curl -X POST http://localhost:3000/api/push/check-windows -H "x-cron-secret: TEU_SECRET"
```
