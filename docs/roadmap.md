# Roadmap

Orden pensado para que cada paso se apoye en el anterior. **No se adelanta trabajo de una versión posterior**: si surge algo, se anota aquí y se sigue con lo actual. El detalle de lo que viene a partir de v3 está en [dominio.md](dominio.md).

## Hecho

- **v0** — Esqueleto del monorepo, Git, `.gitignore`, MariaDB en Docker.
- **v1.0** (22/08/2026, tag `v1.0.0`) — Agenda de una persona: crear, mover, cancelar y completar citas sobre un calendario semanal propio. Detalle en [arquitectura.md](arquitectura.md).
- **v1.1** (12/10/2026, tag `v1.1.0`) — CSS Modules: un `.module.css` por componente, sin cambios visuales. Primera versión implementada por Codex y revisada por Claude.
- **v1.2** (12/10/2026, tag `v1.2.0`) — Robustez: avisos de error del backend en la interfaz, fechas en UTC en la BD, inicio en franjas de 5 min, 400 en JSON mal formado, `precio` como texto, limpieza y script `typecheck`.

## Siguiente

Sin urgencia (solo importa con volumen real): **cargar citas por rango de fechas** desde el backend, con un `useEffect` que dependa de `lunesVisible`. Hoy se traen todas de una vez.

### v1.3 — Pulido estético

Texto desbordado en citas de 30 min, color distinguible para `cancelada` y `completada`, tema general con variables CSS.

### v1.4 — Selector de fecha/hora propio

El `<input type="datetime-local">` se pinta en formato US si el navegador está en inglés, y la página no puede cambiarlo. Selectores propios, con granularidad de 5 min al crear (hoy el click resuelve a la hora en punto).

### Despliegue (infraestructura, en paralelo)

En el Windows donde corre `bot_trading`, con Docker Compose y sin que los proyectos se pisen. Túnel de Cloudflare ya montado: `bot.artesaniaartur.es` (bot_trading) y `dev.artesaniaartur.es` (demos). A mano: `compose.yml` de bot_trading, config de Nginx y `config.yml` del túnel.

## Después

| Versión | Contenido | Dominio |
|---|---|---|
| **v2 — Cimientos** | Migraciones versionadas (una BD v1 con datos se actualiza sin perder nada), tests con Vitest, usuarios y roles comprobados en el backend, y una sola definición de los tipos para frontend y backend (hoy duplicados a mano, sin validar respuestas). Sin esto, tocar el esquema es peligroso. | — |
| **v3 — Plantilla, tiempos y local** | Empleados (plantilla / prueba / prácticas / externo), competencias, duraciones ajustables por empleado, recursos físicos, horarios, turnos, ausencias y bloqueos por eventos. La zona horaria del salón como dato: mostrar en su hora, no en la del dispositivo. | §1–5 |
| **v4 — Agenda real y motor** | Cabecera + líneas con participantes y fases, `no_asistio` y `solicitada`, solapes, motor que sugiere empleado + recurso + hora, guardado transaccional. Después, **arrastrar citas**. | §6–7 |
| **v5 — Dinero y stock** | Tickets, cobros, caja, comisiones, reparto con externos; productos, movimientos de stock, proveedores. VERI\*FACTU antes de cobrar de verdad. | §8 |
| **v6 — Asistentes** | Telegram → WhatsApp → llamadas, sobre el motor de v4. | §10 |
| **v7 — Plano del local** | Editor sobre rejilla y puesto de cada empleado por jornada. | §9 |
| **Más allá** | Estadísticas (cancelaciones, ocupación, tiempo real frente a estimado), zona de espera y cola. | §11 |

### Arrastrar citas (v4)

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
| Repartir `dev.artesaniaartur.es`: por ruta (`dev…/peluqueria`, obliga a `base` en Vite) o subdominio por proyecto | Despliegue |
| Migraciones: SQL numerados + tabla de control propia, o herramienta (dbmate, Knex…) | v2 |
| Autenticación: sesión con cookie o token; cuántos roles | v2 |
| Tipos compartidos: paquete común en el monorepo, o validar respuestas con Zod en el frontend | v2 |
| ¿El cliente puede elegir empleado o solo expresar preferencia? | v3 |
| ¿Alguien en prácticas puede hacer algún servicio sin tutor? | v3 |
| ¿Qué cubre el margen de un servicio (retraso, limpieza, cambio de cliente)? | v3 |
| Arrastrar citas: confirmar dnd-kit | v4 |
| Plano: SVG a mano + dnd-kit, o React Flow | v7 |
