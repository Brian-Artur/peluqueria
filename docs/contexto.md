# CONTEXTO PARA RETOMAR — Proyecto Peluquería

> Última actualización: 22/08/2026 — **v1.0.0 cerrada y etiquetada.**

---

## Quién soy y cómo trabajo

- Estudiante de primero de DAW, base en Java/OOP (nivel básico — **no usar analogías con Java/Spring**, no ayudan). Objetivo: empleabilidad full-stack. España primero, luego Europa/EEUU.
- Trabajo en español. Uso dictado por voz, así que aparecen artefactos de transcripción.
- Prefiero **respuestas breves**, sin explicaciones largas salvo que las pida.
- **Una decisión de arquitectura a la vez**, presentada como bifurcación con causa-efecto ("qué se rompe si me salto esto") antes de dar comandos.
- Verifico cada paso antes de seguir. Commits como migas de pan (conventional commits: feat/refactor/chore/fix/docs).
- Prefiero **código como contenido de archivo directo**, no en bloques `cat` de bash (trabajo en VS Code).
- Aprendo con dibujos (Excalidraw). Documento en **Logseq** (auto-commitea, mismo repo de GitHub, accesible desde el móvil).
- **Patrones que vigilo**: abandonar en el "barro del medio" cuando lo nuevo brilla más; cargar features de v2 antes de tiempo.

### Criterio de código (aplicado desde v1.1)

Prioridad: **escalabilidad y facilidad para retomar** por encima de brevedad. Escalar = añadir archivos, no añadir indirección.

- Un archivo por caso de uso, no por entidad.
- Tipo de retorno explícito en todo lo exportado.
- Zod en la frontera, `z.infer` como tipo. Una sola definición de la forma del dato.
- Cada capa traduce: la fila de MariaDB no llega a React.
- Regla de tres antes de abstraer.
- Comentarios de **por qué**, nunca de qué.
- Ni ternarios anidados ni cadenas largas de `.map().filter()`. Early returns y variables intermedias con nombre.

---

## Stack y herramientas

- Kubuntu, VS Code, Node v24, fish shell.
- **Backend**: Express + TypeScript + Zod + mysql2, puerto **3000** en desarrollo. Capas repository → service → router.
- **Frontend**: React + Vite + TypeScript, `Date` nativo (sin date-fns, decisión consciente). Vite en 5173.
- **MariaDB 12** en Docker, puerto **3305** en desarrollo (loopback). Pasará a 3306 en producción vía `.env`.
- Git + GitHub, monorepo.

---

## Qué hay construido (v1.0 — completo y verificado)

### Backend

- Modelo `cliente`, `servicio`, `cita(estado ENUM, inicio, fin)`. Soft-delete, snapshot de duración.
- Rutas de datos montadas bajo **`/api`**; `/health` queda en la raíz a propósito (lo llama el healthcheck de Docker sin pasar por Nginx).
  - `GET /api/citas`, `/api/clientes`, `/api/servicios`
  - `POST /api/citas` (Zod: `cliente_id`, `servicio_id`, `inicio` ISO)
  - `PATCH /api/citas/:id` (mover; solo `inicio`, el `fin` lo recalcula el service)
  - `POST /api/citas/:id/cancelar`
  - `POST /api/citas/:id/completar`
- Errores tipados (404/409) + middleware centralizado.
- **Máquina de estados**: mover, cancelar y completar solo desde `reservada`. Verificado por curl (204 / 409 / 404).

### Frontend

- Calendario semanal en CSS Grid a mano: 8 columnas (1 etiquetas + 7 días), 133 filas (1 cabecera + 132 franjas de 5 min).
- Componentes en `src/calendario/`: `CabeceraDias`, `Rejilla`, `FilaHora`, `TarjetaCita`, `ControlesSemana`, `Panel`, más `constantes.ts`, `posicion.ts`, `fechas.ts`. Tipos en `src/tipos.ts`.
- Navegación de semanas (`lunesVisible`, botones ±7 días).
- **Filtro por semana visible**: las tarjetas solo se pintan si `inicio >= lunesVisible && inicio < lunesSiguiente`.
- **Panel completo**: crear (selectores de cliente y servicio), mover (`datetime-local`), cancelar, completar. Los botones de transición solo aparecen si `estado === "reservada"`.
- **`key` en `Panel`** derivada de la selección (`cita-${id}` / `hueco-${iso}`) para que el estado del formulario nazca limpio al cambiar de selección.

### Verificado

- Ida y vuelta de zona horaria en mover: se guarda 10:00 y se relee 10:00, sin desplazamiento de ±1h.
- Las tres transiciones de estado responden con el código correcto en los tres caminos (éxito / conflicto / no encontrado).

---

## Dónde estoy exactamente

**v1.0.0 cerrada y etiquetada en local.** Lo único abierto es de infraestructura, no de código:

- ⚠️ **El repo no tiene remoto configurado.** `git push --tags` falla. Prerrequisito para el despliegue, porque el servidor debe consumir de Git y nunca editarse a mano.
  ```
  git remote add origin git@github.com:<usuario>/peluqueria.git
  git push -u origin main
  git push --tags
  ```

**Siguiente frente: desplegar en el Windows donde corre `bot_trading`.**

Restricciones ya conocidas:
- Docker Compose, sin que los proyectos se pisen entre sí.
- Túnel de Cloudflare ya montado con dos subdominios: `bot.artesaniaartur.es` (bot_trading) y `dev.artesaniaartur.es` (el resto de proyectos de demostración).
- Debe quedar la puerta abierta a más proyectos en la misma máquina.

Decisión pendiente de abrir: **cómo repartir `dev.artesaniaartur.es` entre varios proyectos** — por ruta (`dev.../peluqueria`) o por subdominio nuevo por proyecto. No es infraestructura pura: la opción por ruta obliga a configurar `base` en Vite y afecta al build del frontend.

Archivos a tener a mano: `compose.yml` de `bot_trading`, config de Nginx, `config.yml` del túnel (o el ingress del dashboard de Cloudflare).

---

## Roadmap

### v1.1 — CSS Modules (refactor puro)

Migrar `Calendario.css` global a CSS Modules. Sin cambios visuales: al terminar debe verse **idéntico**. Ese es el criterio de verificación.

Va antes del pulido estético a propósito: si se pule primero, se escribe CSS global que luego hay que migrar dos veces.

### v1.2 — Pulido estético

- Texto desbordado en citas de 30 min.
- Color distinguible para `cancelada` y `completada`.
- Tema general y aspecto profesional.

### v1.3 — Selector de fecha/hora propio

El `<input type="datetime-local">` se pinta en formato US (mm/dd/yyyy, AM/PM) si el navegador está en inglés. **No es configurable**: el formato lo decide el navegador, no la página. Afecta a cualquier usuario con el navegador en inglés, no solo a mí.

Sustituirlo por selectores propios. Buen momento para meter también la **granularidad de 5 min al crear** (hoy el click resuelve a la hora en punto).

### Sin versión asignada

- **Cargar citas por rango de fechas** desde el backend (`useEffect` dependiente de `lunesVisible`). Hoy se traen todas de una vez. Solo importa con volumen real — no urge en una app de demostración.
- **Deuda anotada**: el orden de la semana está escrito en dos sitios (`DIAS` numera por posición de array con Lun=0 para el fondo; `getDay()` numera por fecha real con Dom=0 para las citas; el puente es `columnaDeDia()`).

---

## Aparcado conscientemente para v2 (detalle en Logseq)

- **Modelo v2**: empleados, recursos físicos (butacas/camillas), cabecera/líneas (`cita_servicio`), tipos de proceso (activo/pasivo/revisión, invariante "activos ≤ empleados"), detección de solapes, horarios variables, láser externo. Migración desde v1 ya probada como no destructiva.
- **Estado `no_asistió`**. Hoy no se puede representar: un cliente que no se presenta no es `cancelada` (nadie canceló) ni `completada` (no se hizo nada). Es el prerrequisito de cualquier autocompletado por reloj — sin él, marcar por hora guardaría un dato falso.
- **Autocompletado por hora**. Descartado en v1.0 por dos razones: falta `no_asistió`, y necesita infraestructura nueva (cron / `setInterval` / recálculo en lectura).
- **Drag & drop de citas** con auto-avance de semana al arrastrar hasta el borde. Requiere reintroducir la variante `{ tipo: "moviendo"; id }` en `Seleccion` (diseñada y descartada en v1 porque el `datetime-local` la hacía innecesaria) y un `setInterval` con limpieza en `useEffect`. Casos borde: soltar fuera de celda válida, colisión con otra cita, fuera de horario, soltar durante el cambio de semana, eventos táctiles.

---

## Decisiones de arquitectura ya tomadas (no re-litigar)

- **El código no sabe dónde está desplegado.** Nada de `app.use("/peluqueria", ...)`. El prefijo de despliegue vive en Nginx (y en el `base` de Vite si se enruta por ruta). Prueba del criterio: si mañana un cliente quiere la app en su propio dominio en la raíz, se edita una config, no el fuente.
- **`/api` vive en el backend, no en el proxy.** Los routers se montan con `app.use("/api", ...)` y ni Vite ni Nginx reescriben la URL: son tuberías tontas. `/api/citas` es la misma cadena en navegador, proxy y Express. Alternativa descartada: dejar el `rewrite` en Vite, que obligaría a duplicar el prefijo en la config de Nginx y a mantener dos archivos sincronizados a mano.
- **`Seleccion` es una unión discriminada**: `{ tipo: "hueco"; inicio: Date } | { tipo: "cita"; id: number }`, y `null` = panel cerrado. Por construcción no existen estados imposibles, igual que el ENUM de `estado` en el backend.
- **Se guardan IDs, no objetos.** Una sola fuente de verdad; el objeto se recupera con `.find()` sobre la lista viva.
- **`citaSeleccionada` busca sobre la lista completa, no sobre la filtrada por semana.** Si buscara en la filtrada, mover una cita a otra semana la sacaría de la lista y el panel se vaciaría a mitad de operación.
- **El estado vive en el ancestro común más bajo.** `citas`, `clientes`, `servicios`, `lunesVisible` y `seleccion` viven en `Calendario`. Los campos del formulario viven dentro de `Panel` (son efímeros).
- **El hijo avisa, el padre decide.** Los componentes hoja reportan; `Calendario` hace los fetch y refresca. Quien es dueño del dato es quien lo modifica.
- **Refrescar desde el servidor, nunca parchear el estado local** tras crear/mover/cancelar/completar.
- **La UI respeta la máquina de estados del backend**: los botones solo se muestran si la transición es legal.
- **Fechas en UTC al viajar**; conversión explícita a local solo para mostrar y para el `datetime-local`.
- **`completada` la marca un humano, no el reloj.** El reloj sabe que la hora pasó; no sabe si el cliente vino. Sin validación de fecha en v1.0: el peluquero es quien tiene la información.

---

## Aprendizajes de infraestructura (ya resueltos, no repetir)

- **Docker Compose agrupa por nombre de carpeta.** Peluquería y bot_trading tenían ambos `infra/mariadb`, así que Compose los trataba como el mismo proyecto y se recreaban mutuamente. Solución: `name:` explícito de proyecto en cada compose, **más** `name:` real del volumen y `external: true` para no crear volúmenes vacíos al migrar.
- Volúmenes actuales: `mariadb_peluqueria_data`, `mariadb_mariadb_data`, `infra_tramas_db_data`.
- `tsx watch` recarga código pero **no** relee el `.env` — hay que reiniciar el proceso a mano tras editarlo.
- **En Node 24 `localhost` resuelve a IPv6 (`::1`) antes que a IPv4.** Usar `127.0.0.1` explícito en el `target` del proxy de Vite y en cualquier URL interna.
- **Un `.catch(() => setCitas([]))` convierte un 404 en un calendario vacío sin un solo error en consola.** Al depurar "no se ve nada", el primer paso es `curl` directo al backend, no mirar el frontend. Método: comprobar cada eslabón por separado (contenedor arriba → backend responde → proxy traduce bien la URL) antes de mirar el código de React.
