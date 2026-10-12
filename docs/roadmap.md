# Roadmap

Orden pensado para que cada paso se apoye en el anterior. **No se adelanta trabajo de una versión posterior**: si surge algo, se anota aquí y se sigue con lo actual. El detalle de lo que viene a partir de v3 está en [dominio.md](dominio.md).

## Hecho

- **v0** — Esqueleto del monorepo, Git, `.gitignore`, MariaDB en Docker.
- **v1.0** (22/08/2026, tag `v1.0.0`) — Agenda de una persona: crear, mover, cancelar y completar citas sobre un calendario semanal propio. Detalle en [arquitectura.md](arquitectura.md).

## Siguiente

### Sanear el entorno

`npm ci` en ambos paquetes y permisos de vuelta a 644 tras copiar la carpeta. Subir a GitHub el commit pendiente y esta documentación.

### v1.1 — CSS Modules (refactor puro)

Migrar `Calendario.css` global a un `.module.css` por componente. **Sin cambios visuales**: debe verse idéntico; ese es el criterio. Va antes del pulido para no escribir CSS global que luego haya que migrar dos veces. Tarea para Codex.

Reparto de selectores: `.calendario` → Calendario; `.cabecera-dia`, `.esquina` → CabeceraDias; `.etiqueta-hora`, `.celda` → FilaHora; `.cita`, `.cita.completada`, `.cita.cancelada`, `.cita-cliente`, `.cita-servicio` → TarjetaCita. `index.css` sigue global (reset y variables).

### v1.2 — Robustez

Deuda detectada en la auditoría del 11/10/2026:

- Los `fetch` ignoran `res.ok`: tras un error el panel se cierra como si nada, o se guarda un objeto de error donde se espera un array (`Calendario.tsx`).
- El pool de mysql2 no fija `timezone`: convierte los `DATETIME` con la zona del **proceso Node**. Si el backend corre con otra zona (los contenedores suelen ir en UTC), las horas se desplazan (`db.ts`).
- `precio` es `DECIMAL`: mysql2 lo devuelve como string y el frontend lo tipa como `number`.
- Mover acepta minutos arbitrarios (10:07) y `posicion.ts` divide entre 5 sin redondear → fila fraccionaria.
- JSON mal formado en el body → 500 genérico en vez de 400.
- Tipos duplicados a mano entre frontend y backend, sin validar respuestas.
- Sobras de la plantilla de Vite (`hero.png`, `react.svg`, `vite.svg`); `.panel` y `.controles-semana` sin reglas CSS.
- Backend sin scripts de `build` ni `typecheck`.

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
| **v2 — Cimientos** | Migraciones versionadas (una BD v1 con datos se actualiza sin perder nada), tests con Vitest, usuarios y roles comprobados en el backend. Sin esto, tocar el esquema es peligroso. | — |
| **v3 — Plantilla, tiempos y local** | Empleados (plantilla / prueba / prácticas / externo), competencias, duraciones ajustables por empleado, recursos físicos, horarios, turnos, ausencias y bloqueos por eventos. | §1–5 |
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
| ¿El cliente puede elegir empleado o solo expresar preferencia? | v3 |
| ¿Alguien en prácticas puede hacer algún servicio sin tutor? | v3 |
| ¿Qué cubre el margen de un servicio (retraso, limpieza, cambio de cliente)? | v3 |
| Arrastrar citas: confirmar dnd-kit | v4 |
| Plano: SVG a mano + dnd-kit, o React Flow | v7 |
