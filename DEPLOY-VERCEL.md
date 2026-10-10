# Despliegue en Vercel

## Arquitectura

| Parte | Dónde corre | Origen |
|---|---|---|
| Frontend (React + probador AR) | CDN de Vercel (estático) | `vite build` → `.vercel/output/static` |
| API (`/api/*`, Express) | 1 Vercel Function (Node 22) | `server/vercel-handler.ts` empaquetado con esbuild |
| Datos | Postgres (Neon) | `DATABASE_URL` |

`npm run vercel-build` (`script/build-vercel.mjs`) genera `.vercel/output` con el
[Build Output API v3](https://vercel.com/docs/build-output-api). La API queda en
un solo archivo, sin depender de `node_modules` ni de los alias `@shared/*`.

**Por qué Postgres es obligatorio aquí:** las funciones serverless no comparten
memoria. Con el almacenamiento en memoria, una cita creada en una instancia no
existe en la siguiente y todo se pierde en cada despliegue.

## Pasos (una sola vez)

1. **Importar el repo** en Vercel → *Add New → Project* → `practicmike/OpticaVisionAR`.
   `vercel.json` ya fija el build; no cambies *Framework Preset* (queda en "Other").
2. **Base de datos:** en el proyecto → *Storage → Create → Neon (Postgres)* →
   conectar a Production y Preview. Esto crea `DATABASE_URL` automáticamente.
3. **Crear tablas y cargar catálogo** desde tu máquina (o Replit):
   ```bash
   vercel env pull .env.local            # o copia DATABASE_URL a mano
   export $(grep DATABASE_URL .env.local | xargs)
   npm run db:push                       # crea/actualiza tablas
   npm run db:seed                       # sucursales, servicios, armazones, blog, testimonios
   ```
   El seed es re-ejecutable: no duplica datos.
4. **Redeploy** (o push a la rama). Listo.

Los horarios de citas de los próximos 14 días se generan solos al consultarse
(hora de `America/Mexico_City`); no hace falta cron.

## Verificación después del deploy

- `https://<tu-dominio>/api/frames` → 15 armazones (3 con `modelUrl`).
- `https://<tu-dominio>/api/appointment-slots?locationId=1&date=<lunes YYYY-MM-DD>` → 7 horarios.
- `/virtual-try-on` → pedir cámara funciona (HTTPS es obligatorio para `getUserMedia`; Vercel lo da por defecto).
- Recargar una ruta interna (p. ej. `/appointments`) no da 404.

## Desarrollo local

Sin cambios: `npm run dev` (puerto 5000, o `PORT`). Sin `DATABASE_URL` usa el
almacenamiento en memoria; con `DATABASE_URL` usa Postgres.

## Cambios de esquema

`frames` ganó `model_url` y `model_rotation_y` (antes solo existían en memoria) y
`appointment_slots` un índice único `(location_id, date, start_time)`. Tras
cualquier cambio en `shared/schema.ts`: `npm run db:push`.
