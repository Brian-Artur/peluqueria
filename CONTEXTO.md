## CONTEXTO PARA RETOMAR — Proyecto Peluquería

### Quién soy y cómo trabajo

- Estudiante de primero de DAW, base en Java/OOP (nivel básico — **no usar analogías con Java/Spring**, no ayudan). Objetivo: empleabilidad full-stack. España primero, luego Europa/EEUU.
- Trabajo en español. Uso dictado por voz, así que aparecen artefactos de transcripción.
- Prefiero **respuestas breves**, sin explicaciones largas salvo que las pida.
- **Una decisión de arquitectura a la vez**, presentada como bifurcación con causa-efecto ("qué se rompe si me salto esto") antes de dar comandos.
- Verifico cada paso antes de seguir. Commits como migas de pan (conventional commits: feat/refactor/chore/fix/docs).
- Prefiero **código como contenido de archivo directo**, no en bloques `cat` de bash (trabajo en VS Code).
- Aprendo con dibujos (Excalidraw). Documento en **Logseq** (auto-commitea, mismo repo de GitHub, accesible desde el móvil). Tengo una página separada para conocimiento de React y otra para el proyecto.
- **Patrones que vigilo**: abandonar en el "barro del medio" cuando lo nuevo brilla más; cargar features de v2 antes de tiempo.

### Stack y herramientas

- Kubuntu, VS Code, Node v24, fish shell.
- **Backend**: Express + TypeScript + Zod + mysql2. Capas repository → service → router.
- **Frontend**: React + Vite + TypeScript, `Date` nativo (sin date-fns, decisión consciente).
- **MariaDB 12** en Docker, puerto **3305** en desarrollo (loopback). Pasará a 3306 en producción vía `.env`.
- Git + GitHub, monorepo.

### Qué hay construido

**Backend (completo para v1):**

- Modelo `cliente`, `servicio`, `cita(estado ENUM, inicio, fin)`. Soft-delete, snapshot de duración.
- `GET /api/citas`, `/api/clientes`, `/api/servicios`.
- `POST /api/citas` (Zod: `cliente_id`, `servicio_id`, `inicio` como string ISO).
- `PATCH /api/citas/:id` (mover, solo `inicio`; el `fin` lo recalcula el service).
- `POST /api/citas/:id/cancelar`.
- Errores tipados (404/409) + middleware centralizado. Reglas: solo se mueven/cancelan citas en estado `reservada`.

**Frontend:**

- Calendario semanal en CSS Grid a mano: 8 columnas (1 etiquetas + 7 días), 133 filas (1 cabecera + 132 franjas de 5 min).
- Componentes en `src/calendario/`: `CabeceraDias`, `Rejilla`, `FilaHora`, `TarjetaCita`, `ControlesSemana`, `Panel`, más `constantes.ts`, `posicion.ts`, `fechas.ts`. Tipos en `src/tipos.ts`.
- **Navegación de semanas**: estado `lunesVisible` en `Calendario`, botones ±7 días.
- **Panel funcional**: click en celda vacía → crear cita (selectores de cliente y servicio + POST); click en tarjeta → ver datos + cancelar.

### Dónde estoy exactamente

**A medias: "mover cita" con `<input type="datetime-local">`.** El código está escrito pero **sin verificar ni commitear**. Quedaban tres ajustes en `Panel.tsx`:

1. Importar `fechaParaInput` (debe vivir en `fechas.ts`).
2. Declarar `const [nuevoInicio, setNuevoInicio] = useState("")`.
3. Corregir el tipo de la prop: `onMover: (id: number, inicio: string) => void` (estaba como `() => void`).

**Bloqueo sin resolver**: al arrancar, Vite saltó al puerto 5174 (5173 ocupado) y el calendario aparecía vacío. La hipótesis sin confirmar era que el backend no estaba levantado o no conectaba a MariaDB en 3305. Primer comando al retomar: `curl http://localhost:4000/health`.

**Pendiente de verificar en mover**: la ida y vuelta de zona horaria (guardar 10:00 → releer 10:00, sin desplazamiento de ±1h).

### Qué falta para cerrar v1.0

1. Terminar y verificar **mover cita**.
2. **Filtrar tarjetas por semana visible** (`.filter` en `Calendario`). Hoy las citas se posicionan solo por día-de-la-semana y hora, así que se ven en todas las semanas.
3. Pulido estético: texto desbordado en citas de 30 min, color de "cancelada", tema general. CSS Modules como plan de estilo.

### Aparcado conscientemente (detalle en Logseq)

- **v2 modelo**: empleados, recursos físicos (butacas/camillas), cabecera/líneas (`cita_servicio`), tipos de proceso (activo/pasivo/revisión, invariante "activos ≤ empleados"), detección de solapes, horarios variables, láser externo. Migración desde v1 ya probada como no destructiva.
- **Cargar citas por rango de fechas** desde el backend (`useEffect` dependiente de `lunesVisible`). Hoy se traen todas de una vez.
- **Granularidad de 5 min al crear** (hoy el click resuelve a la hora en punto).
- **Drag & drop de citas** con auto-avance de semana al arrastrar hasta el borde lateral. Requeriría reintroducir la variante `{ tipo: "moviendo"; id }` en `Seleccion` (diseñada y descartada en v1 porque el `datetime-local` la hacía innecesaria) y un `setInterval` con limpieza en `useEffect`. Casos borde a resolver: soltar fuera de celda válida, colisión con otra cita, fuera de horario, soltar durante el cambio de semana, eventos táctiles.

### Decisiones de arquitectura ya tomadas (no re-litigar)

- **`Seleccion` es una unión discriminada**: `{ tipo: "hueco"; inicio: Date } | { tipo: "cita"; id: number }`, y `null` = panel cerrado. Motivo: por construcción no existen estados imposibles, igual que el ENUM de `estado` en el backend.
- **Se guardan IDs, no objetos.** Una sola fuente de verdad; el objeto se recupera con `.find()` sobre la lista viva.
- **El estado vive en el ancestro común más bajo.** `citas`, `clientes`, `servicios`, `lunesVisible` y `seleccion` viven en `Calendario`. Los campos del formulario viven dentro de `Panel` (son efímeros; el panel se monta/desmonta y así nacen limpios).
- **El hijo avisa, el padre decide.** Los componentes hoja reportan (`onSeleccionarHueco(d, hora)`, `onSeleccionarCita(id)`); `Calendario` hace los fetch y refresca. Quien es dueño del dato es quien lo modifica.
- **Refrescar desde el servidor, nunca parchear el estado local** tras crear/mover/cancelar.
- **La UI respeta la máquina de estados del backend**: los botones de mover/cancelar solo se muestran si `estado === "reservada"`.
- **Dos mundos de fechas**: `DIAS` numera por posición de array (Lun=0) para el fondo; `getDay()` numera por fecha real (Dom=0) para las citas. El puente es `columnaDeDia()`. _Deuda anotada_: el orden de la semana está escrito en dos sitios.
- **Fechas en UTC al viajar**; conversión explícita a local solo para mostrar y para el `datetime-local`.

### Aprendizajes de infraestructura (ya resueltos, no repetir)

- **Docker Compose agrupa por nombre de carpeta.** Peluquería y bot_trading tenían ambos `infra/mariadb`, así que Compose los trataba como el mismo proyecto y se recreaban mutuamente. Solución: `name:` explícito de proyecto en cada compose, **más** `name:` real del volumen y `external: true` para no crear volúmenes vacíos al migrar.
- Volúmenes actuales: `mariadb_peluqueria_data`, `mariadb_mariadb_data`, `infra_tramas_db_data`.
- `tsx watch` recarga código pero **no** relee el `.env` — hay que reiniciar el proceso a mano tras editarlo.