# Decisiones cerradas

**No se re-litigan de paso.** Si alguna se replantea, es decisión del usuario, no una sugerencia de un agente en mitad de otra tarea. Las decisiones pendientes están en [roadmap.md](roadmap.md) → "Decisiones abiertas".

## Producto

- **El sistema sugiere, la persona decide.** `completada` la marca un humano: el reloj sabe que la hora pasó, no si el cliente vino. Las duraciones aprendidas son sugerencias que el encargado acepta o no; el motor de asignación propone huecos, no los impone; los asistentes crean citas por confirmar.

## Stack y entorno

- Backend Express + TypeScript + Zod + mysql2. Frontend React + Vite + TypeScript. MariaDB 12 en Docker. Monorepo.
- **`Date` nativo** (sin date-fns) y **calendario en CSS Grid a mano** (sin librería de calendario).
- **CSS Modules** para estilos. Ni Tailwind ni Bootstrap.
- Esquema y semilla versionados en `infra/mariadb/initdb/`, con prefijo numérico: mismo `docker compose up`, misma BD en cualquier máquina.
- Credenciales fuera del repo (`db.env`, `.env`). Usuario de app (`peluqueria_app`) separado de root, con privilegio mínimo.
- Puertos propios para convivir con otros proyectos en la misma máquina: BD **3305**, backend **3100**, Vite **5180** con `strictPort` (si está ocupado, falla en vez de saltar a otro).
- Puerto de MariaDB atado a loopback **en el compose**: así se esquiva que Docker se salte UFW, sin tocar el firewall.

## Backend

- **Capas**: repository (solo SQL parametrizado, anti-inyección) → service (negocio, sin saber nada de HTTP) → router (valida con Zod y traduce a HTTP).
- Errores tipados con middleware central, montado el último: `ErrorNoEncontrado` → 404, `ErrorConflicto` → 409.
- `/health` comprueba de verdad la BD; no devuelve un OK de mentira.
- **Snapshot**: la cita congela su `fin`. Lo mismo se hará con precio y duración aplicada.

## Despliegue y rutas

- **El código no sabe dónde está desplegado.** Nada de `app.use("/peluqueria", ...)`. El prefijo vive en Nginx (y en el `base` de Vite si se enruta por ruta). Prueba: si un cliente quiere la app en la raíz de su dominio, se edita una config, no el código.
- **`/api` vive en el backend, no en el proxy.** Vite y Nginx son tuberías tontas que no reescriben la URL: `/api/citas` es la misma cadena en navegador, proxy y Express. El proxy de Vite existe para evitar CORS en desarrollo.
- `/health` queda en la raíz, fuera de `/api`, para que lo llame el healthcheck de Docker sin pasar por Nginx (aún no existe).

## Frontend

- **`Seleccion` es una unión discriminada**: `{ tipo: "hueco"; inicio: Date } | { tipo: "cita"; id: number }`, y `null` = panel cerrado. Por construcción no hay estados imposibles.
- **Se guardan IDs, no objetos.** El objeto se recupera con `.find()` sobre la lista viva.
- **`citaSeleccionada` busca sobre la lista completa**, no la filtrada por semana: si no, mover una cita a otra semana vaciaría el panel a mitad de operación.
- **El estado vive en el ancestro común más bajo.** Datos y selección en `Calendario`; los campos del formulario, dentro de `Panel`.
- **El hijo avisa, el padre decide.** Las hojas reportan; `Calendario` hace los fetch.
- **Refrescar desde el servidor, nunca parchear el estado local** tras crear, mover, cancelar o completar.
- **La UI respeta la máquina de estados del backend**: un botón solo aparece si la transición es legal.
- **Fechas en UTC al viajar**; conversión a local solo para mostrar y para el `datetime-local`.

## Deuda anotada — no "arreglar" por sorpresa

- El orden de la semana está escrito en dos sitios: `DIAS` numera por posición de array (Lun=0), `getDay()` por fecha real (Dom=0). El puente es `columnaDeDia()`.

## Lecciones de infraestructura (no repetir)

- **Docker Compose agrupa por nombre de carpeta.** Peluquería y bot_trading tenían ambos `infra/mariadb` y se recreaban mutuamente. Solución: `name:` explícito de proyecto en cada compose, **más** `name:` real del volumen y `external: true`. Volúmenes: `mariadb_peluqueria_data`, `mariadb_mariadb_data`, `infra_tramas_db_data`.
- `tsx watch` recarga código pero **no** relee `.env`: reiniciar tras editarlo.
- **En Node 24 `localhost` resuelve a IPv6 (`::1`) antes que a IPv4.** Usar `127.0.0.1` en el proxy de Vite y en cualquier URL interna.
- **Un `.catch(() => setCitas([]))` convierte un 404 en un calendario vacío sin un solo error en consola.** Al depurar "no se ve nada", primero `curl` directo al backend; comprobar cada eslabón (contenedor → backend → proxy) antes de mirar React.
- Copiar el proyecto con `node_modules` rompe `node_modules/.bin` y cambia permisos a 755: se arregla con `npm ci` y devolviendo los permisos (octubre 2026).
