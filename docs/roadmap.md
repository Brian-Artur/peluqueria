# Roadmap

Orden pensado para que cada paso se apoye en el anterior. **No se adelanta trabajo de una versión posterior**: si surge algo, se anota aquí y se sigue con lo actual. El detalle de lo que viene a partir de v4 está en [dominio.md](dominio.md).

## Hecho

- **v0** — Esqueleto del monorepo, Git, `.gitignore`, MariaDB en Docker.
- **v1.0** (22/08/2026, tag `v1.0.0`) — Agenda de una persona: crear, mover, cancelar y completar citas sobre un calendario semanal propio. Detalle en [arquitectura.md](arquitectura.md).
- **v1.1** (12/10/2026, tag `v1.1.0`) — CSS Modules: un `.module.css` por componente, sin cambios visuales. Primera versión implementada por Codex y revisada por Claude.
- **v1.2** (12/10/2026, tag `v1.2.0`) — Robustez: avisos de error del backend en la interfaz, fechas en UTC en la BD, inicio en franjas de 5 min, 400 en JSON mal formado, `precio` como texto, limpieza y script `typecheck`.
- **v1.3** (12/10/2026, tag `v1.3.0`) — Pulido estético: paleta ciruela en variables CSS, tarjetas con tinte y barra, calendario a todo el alto, panel a la derecha con selección visible, días de apertura (mar–sáb) con los de cierre bajo demanda, semana ISO y flechas en la cabecera. Resuelta la deuda del orden de la semana.
- **v1.4** (12/10/2026, tag `v1.4.0`) — Selector de fecha y hora propio (mini calendario del mes y desplegables de 5 en 5) para crear y mover; al pulsar un hueco, la cita empieza en la franja de 5 min bajo el ratón. Cierra la serie v1.
- **v2.0** (13/10/2026, tag `v2.0.0`) — Migraciones con script propio: `backend/migraciones/` como única fuente del esquema, `npm run migrar` y `npm run sembrar`; fuera `initdb/`.
- **v2.1** (13/10/2026, tag `v2.1.0`) — Tests con Vitest de la lógica pura: fechas, semana ISO, días visibles, posición, franjas, peticiones, archivos de migración y validación del inicio (59 tests). Pendiente: tests de integración con MariaDB, cuando haya migraciones que probar.
- **v2.2** (13/10/2026, tag `v2.2.0`) — Monorepo con npm workspaces y contratos de la API en `compartido/` (esquemas Zod), usados por backend y frontend; el frontend valida cada respuesta. Cierra v2.
- **v3.0** (13/10/2026, tag `v3.0.0`) — Clientes: navegación con React Router, pantalla lista + ficha con búsqueda, alta rápida desde la cita, email y notas (migraciones 001–002), teléfonos en E.164 con prefijo y formato (migración 003; absorbe la antigua v3.1). Cierra la serie v3.

## Siguiente

### v2 — Cimientos

Sin esto, tocar el esquema o crecer el código es peligroso.


### v3 — Clientes

Hecha (ver arriba). Pendiente para más adelante: archivar clientes y su historial de citas en la ficha.


## Después

| Versión | Contenido | Dominio |
|---|---|---|
| **v4 — Plantilla, tiempos y local** | **v4.0** usuarios y roles comprobados en el backend (el encargado es quien ajusta tiempos y bloqueos). Después: empleados (plantilla / prueba / prácticas / externo), competencias, duraciones ajustables por empleado, recursos físicos, horarios, turnos, ausencias y bloqueos por eventos. La zona horaria del salón como dato: mostrar en su hora, no en la del dispositivo. | §1–5 |
| **v5 — Mejoras sueltas** | Modo oscuro (sobre las variables de `index.css`), vista para móvil y cargar las citas por rango de fechas desde el backend (hoy se traen todas; solo importa con volumen real). | — |
| **v6 — Agenda real y motor** | Cabecera + líneas con participantes y fases, `no_asistio` y `solicitada`, solapes, motor que sugiere empleado + recurso + hora, guardado transaccional. El panel de la cita gana una sección con el empleado o empleados asignados. Después, **arrastrar citas**. | §6–7 |
| **v7 — Dinero y stock** | Tickets, cobros, caja, comisiones, reparto con externos; productos, movimientos de stock, proveedores. VERI\*FACTU antes de cobrar de verdad. | §8 |
| **v8 — Asistentes** | Telegram → WhatsApp → llamadas, sobre el motor de v6. | §10 |
| **v9 — Plano del local** | Editor sobre rejilla y puesto de cada empleado por jornada. | §9 |
| **Más allá** | Estadísticas (cancelaciones, ocupación, tiempo real frente a estimado), zona de espera y cola. | §11 |
| **Despliegue** | Aparcado: el Windows de bot_trading va justo. Cuando toque, en una máquina virtual del portátil o en otro ordenador, con Docker Compose. **Dos servicios independientes**: frontend estático (el build ya incluye `compartido/`) servido por Nginx, que reenvía `/api` al contenedor del backend. Decidir entonces si el backend corre con `tsx` o se empaqueta en un solo JS. Nginx debe devolver `index.html` para cualquier ruta del frontend (`try_files`), porque las URLs de React Router (`/clientes/12`) no son archivos. Al cambiar un contrato: añadir campos es seguro; quitar o renombrar exige desplegar primero el backend aceptando ambos. | — |

### Arrastrar citas (v6)

- Librería recomendada: **dnd-kit** (ya usada en bot_trading); se confirma al llegar. Ver [dominio.md](dominio.md) → "Librerías".
- Reintroduce la variante `{ tipo: "moviendo"; id }` en `Seleccion` (descartada en v1 porque el `datetime-local` la hacía innecesaria).
- Auto-avance de semana al llevar la cita al borde: temporizador que dispara `±7 días` mientras el puntero está en la franja lateral y se cancela al volver; `useEffect` con limpieza.
- Casos borde: soltar fuera de celda válida, sobre otra cita, fuera de horario, durante el cambio de semana; eventos táctiles.
- Va después del motor porque necesita saber si el hueco de destino es válido.
- Que se vea la **animación** de la tarjeta viajando de un día a otro (en dnd-kit, `DragOverlay`).
- Revisar entonces el panel: pasar de columna a la derecha a **una tarjeta que se amplía** (zoom sobre la propia cita) **o una ventana flotante**. Encaja mejor con arrastrar, porque la acción ocurre sobre la cita y no en una columna aparte.

### Ramas

Hasta v1 todo se hizo en `main` con tags. Para v2 en adelante hay prevista una rama por frente (`feature/agenda`, `feature/empleados`…):

![Estrategia de ramas](_assets/estrategia-ramas.svg)

## Decisiones abiertas

Se deciden de una en una, cuando toque.

| Decisión | Cuándo |
|---|---|
| Dónde y cómo desplegar (máquina virtual del portátil u otro ordenador; si se usa `dev.artesaniaartur.es`, por ruta o por subdominio) | Despliegue |
| Autenticación: sesión con cookie o token; cuántos roles | v4.0 |
| ¿El cliente puede elegir empleado o solo expresar preferencia? | v4 |
| ¿Alguien en prácticas puede hacer algún servicio sin tutor? | v4 |
| ¿Qué cubre el margen de un servicio (retraso, limpieza, cambio de cliente)? | v4 |
| Arrastrar citas: confirmar dnd-kit | v6 |
| Plano: SVG a mano + dnd-kit, o React Flow | v9 |
