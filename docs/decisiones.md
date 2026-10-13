# Decisiones cerradas

**No se re-litigan de paso.** Si alguna se replantea, es decisión del usuario, no una sugerencia de un agente en mitad de otra tarea. Las decisiones pendientes están en [roadmap.md](roadmap.md) → "Decisiones abiertas".

## Producto

- **El sistema sugiere, la persona decide.** `completada` la marca un humano: el reloj sabe que la hora pasó, no si el cliente vino. Las duraciones aprendidas son sugerencias que el encargado acepta o no; el motor de asignación propone huecos, no los impone; los asistentes crean citas por confirmar.

## Stack y entorno

- Backend Express + TypeScript + Zod + mysql2. Frontend React + Vite + TypeScript. MariaDB 12 en Docker. Monorepo.
- **`Date` nativo** (sin date-fns) y **calendario en CSS Grid a mano** (sin librería de calendario).
- **CSS Modules** para estilos. Ni Tailwind ni Bootstrap.
- **Todos los colores, espacios y radios son variables en `index.css`**; ningún hexadecimal en los módulos. Cambiar de paleta o añadir modo oscuro es tocar un solo archivo.
- **Paleta "ciruela suave"** (12/10/2026): blanco, gris cálido, acento ciruela `#7A4E7E`, completada en verde azulado `#2F7A72`. Alternativa que sigue en pie: "salón cálido" (fondo `#FBF7F2`, superficie `#F3EBE1`, texto `#3A2E28`, suave `#85756A`, línea `#E9DED2`, acento terracota `#B5543C` / tinte `#F7E3DC`, ok `#6B7A3A` / tinte `#ECEFDD`). **Descartada**: neutro con azul petróleo, demasiado frío y serio.
- **Tarjetas de cita con tinte + barra lateral** del color del estado; los estados no dependen solo del color (✓ en completada, borde discontinuo y tachado en cancelada). Las citas de 30 min o menos van en una línea con "…" y el texto completo en `title`.
- **Días visibles**: los de apertura (martes a sábado, constante `DIAS_APERTURA` hasta que el horario esté en la BD en v4). Un día de cierre aparece solo si esa semana tiene alguna cita, para que nunca haya citas invisibles; "Mostrar días cerrados" enseña los que faltan. Las columnas salen de la lista de fechas visibles: **una sola numeración de días**, la de `getDay()`.
- **Semana por número ISO** en la esquina de la rejilla; flechas de semana dentro de la cabecera.
- **Panel a la derecha** del calendario, fijo al hacer scroll. Modo oscuro: más adelante, sobre las mismas variables.
- **Migraciones con script propio** (13/10/2026): `backend/migraciones/NNN-descripcion.sql` son la **única fuente del esquema**; `npm run migrar` aplica las pendientes en orden y las anota en la tabla `migracion`. Sin "deshacer": un error se corrige con otra migración. Un único cambio por archivo, porque el DDL de MariaDB no es transaccional. Descartadas: dbmate (binario externo) y Knex/Drizzle (chocan con los repositories de SQL a mano).
- **Monorepo con npm workspaces** (13/10/2026): `compartido/`, `backend/`, `frontend/`, un solo lockfile en la raíz. Pensado para crecer añadiendo paquetes (p. ej. los asistentes de v8) sin tocar los demás.
- **Contratos compartidos** en `compartido/`: esquemas Zod de lo que viaja por la API y sus tipos. **Solo contratos, nunca lógica de negocio ni acceso a BD**, para que ningún servicio quede atado a otro. El backend valida los cuerpos con ellos y sus repositorios traducen cada fila al contrato; el frontend valida cada respuesta (`pedirJson(url, esquema)`). Los nombres de campo siguen en snake_case, como hoy viaja el JSON.
- **Tests con Vitest al lado de cada archivo** (`x.ts` → `x.test.ts`), imports explícitos y nombres en español. La zona horaria de los tests es `Europe/Madrid`, fijada en `vitest.config.mts` (no en el script, para que funcione igual en Windows). Lo que se quiere probar se extrae a funciones puras (p. ej. `franjaEnPosicion`, `inicioEnFranja`).
- **Datos de ejemplo aparte** (`npm run sembrar`), que se niega a ejecutarse si ya hay clientes. Una BD nueva: `docker compose up` → `npm run migrar` → `npm run sembrar`.
- Credenciales fuera del repo (`db.env`, `.env`). Usuario de app (`peluqueria_app`) separado de root, con privilegio mínimo.
- Puertos propios para convivir con otros proyectos en la misma máquina: BD **3305**, backend **3100**, Vite **5180** con `strictPort` (si está ocupado, falla en vez de saltar a otro).
- Puerto de MariaDB atado a loopback **en el compose**: así se esquiva que Docker se salte UFW, sin tocar el firewall.

## Backend

- **Capas**: repository (solo SQL parametrizado, anti-inyección) → service (negocio, sin saber nada de HTTP) → router (valida con Zod y traduce a HTTP).
- Errores tipados con middleware central, montado el último: `ErrorNoEncontrado` → 404, `ErrorConflicto` → 409.
- `/health` comprueba de verdad la BD; no devuelve un OK de mentira.
- **Snapshot**: la cita congela su `fin`. Lo mismo se hará con precio y duración aplicada.
- **La BD guarda las fechas en UTC** (`timezone: "Z"` en el pool de mysql2), no en la hora de la máquina. Así no depende de cómo esté configurado el servidor (12/10/2026). La semilla está escrita en UTC.
- **`precio` viaja como texto**: mysql2 devuelve `DECIMAL` como string y así se tipa. Cómo representar el dinero para hacer cuentas (céntimos enteros, librería decimal…) se decide en v7.

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
- **Fechas en UTC al viajar**; conversión a local solo para mostrar y para elegir fecha y hora.
- **Selector de fecha y hora propio**, sin `datetime-local` ni `type="date"` (su formato lo decide el idioma del navegador): mini calendario del mes y desplegables de hora y minutos de 5 en 5. Al pulsar un hueco, la cita empieza en la franja de 5 min bajo el ratón.

## Deuda anotada — no "arreglar" por sorpresa

Ninguna abierta. (La del orden de la semana en dos sitios se resolvió el 12/10/2026: ahora solo existen `getDay()` y fechas reales.)

## Lecciones de infraestructura (no repetir)

- **Docker Compose agrupa por nombre de carpeta.** Peluquería y bot_trading tenían ambos `infra/mariadb` y se recreaban mutuamente. Solución: `name:` explícito de proyecto en cada compose, **más** `name:` real del volumen y `external: true`. Volúmenes: `mariadb_peluqueria_data`, `mariadb_mariadb_data`, `infra_tramas_db_data`.
- `tsx watch` recarga código pero **no** relee `.env`: reiniciar tras editarlo.
- **En Node 24 `localhost` resuelve a IPv6 (`::1`) antes que a IPv4.** Usar `127.0.0.1` en el proxy de Vite y en cualquier URL interna.
- **Un `.catch(() => setCitas([]))` convierte un 404 en un calendario vacío sin un solo error en consola.** Al depurar "no se ve nada", primero `curl` directo al backend; comprobar cada eslabón (contenedor → backend → proxy) antes de mirar React.
- Copiar el proyecto con `node_modules` rompe `node_modules/.bin` y cambia permisos a 755: se arregla con `npm ci` y devolviendo los permisos (octubre 2026).
