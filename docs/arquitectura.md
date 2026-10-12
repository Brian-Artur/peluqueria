# Arquitectura — cómo está construido hoy (v1.2)

Lo que existe en el código. Lo que vendrá está en [dominio.md](dominio.md); el porqué de cada elección, en [decisiones.md](decisiones.md).

## Monorepo

```
backend/    Express + TypeScript + Zod + mysql2
frontend/   React + Vite + TypeScript
infra/      MariaDB en Docker (docker-compose + initdb/)
docs/       esta documentación (bóveda de Obsidian)
```

![Esqueleto del monorepo](_assets/esqueleto-monorepo.excalidraw.svg)

## Base de datos

MariaDB 12 en Docker, puerto `127.0.0.1:3305` (solo loopback). `initdb/01-schema.sql` y `02-seed.sql` se ejecutan solos la primera vez, con el volumen vacío; el prefijo numérico fija el orden.

| Tabla | Columnas | Notas |
|---|---|---|
| `cliente` | id, nombre, telefono | Teléfono opcional y **texto**, no número. |
| `servicio` | id, nombre, duracion_min, precio | Catálogo. `precio` aún no se usa. |
| `cita` | id, cliente_id, servicio_id, inicio, fin, estado | FK a cliente y servicio. |

- `estado` es un ENUM `reservada` / `cancelada` / `completada`: **máquina de estados** y soft-delete (cancelar no borra).
- `inicio` y `fin` se **congelan en la cita** (snapshot): cambiar la duración del catálogo no altera las citas ya creadas.
- **No hay detección de solapes**: v1 asume una sola persona implícita.

## Backend

Capas: **router** (HTTP + Zod) → **service** (reglas de negocio) → **repository** (solo SQL parametrizado). Hoy solo `citas` tiene service; `clientes` y `servicios` son lecturas directas al repository.

![Del /health a la base de datos](_assets/backend-health.png)

| Método y ruta | Qué hace |
|---|---|
| `GET /health` | Comprueba de verdad la conexión a la BD. Fuera de `/api` a propósito. |
| `GET /api/clientes`, `/api/servicios` | Listados. |
| `GET /api/citas` | Con JOIN que resuelve nombres de cliente y servicio. |
| `POST /api/citas` | Zod: `cliente_id`, `servicio_id`, `inicio` (ISO, en franja de 5 min). El `fin` lo calcula el backend. |
| `PATCH /api/citas/:id` | Mover: solo llega `inicio` (en franja de 5 min); el service recalcula el `fin`. |
| `POST /api/citas/:id/cancelar` | Transición a `cancelada`. |
| `POST /api/citas/:id/completar` | Transición a `completada`. |

- Mover, cancelar y completar solo desde `reservada`. Si no → **409**. Si no existe → **404**. Datos inválidos o JSON mal formado → **400**. Todos los errores responden `{ "error": "mensaje" }`.
- El pool de mysql2 usa `timezone: "Z"`: los `DATETIME` de la BD están en **UTC**.
- Errores tipados (`ErrorNoEncontrado`, `ErrorConflicto`) y middleware central, montado el último.

## Frontend

Calendario semanal en **CSS Grid escrito a mano**. Estilos con **CSS Modules**: cada componente tiene su `.module.css` al lado; solo `index.css` es global.

![Rejilla del calendario y sus componentes](_assets/calendario-semanal.png)

- 8 columnas (etiquetas de hora + 7 días) y 133 filas (cabecera + 132 franjas de 5 min, de 9:00 a 20:00).
- La malla de 5 min está por debajo; las líneas solo se ven en las horas en punto.
- Cada cita se coloca por columna (día) y filas (inicio → fin): **la altura del bloque es la duración**.
- Colores por estado: reservada azul, completada verde, cancelada gris tachada.

| Archivo | Papel |
|---|---|
| `Calendario.tsx` | Dueño del estado (`citas`, `clientes`, `servicios`, `lunesVisible`, `seleccion`) y de los fetch. |
| `calendario/CabeceraDias.tsx` | Nombres de los días. |
| `calendario/Rejilla.tsx`, `FilaHora.tsx` | Horas y celdas clicables. |
| `calendario/TarjetaCita.tsx` | Una cita en la rejilla. |
| `calendario/ControlesSemana.tsx` | Semana anterior / siguiente (±7 días). |
| `calendario/Panel.tsx` | Crear (cliente + servicio), mover (`datetime-local`), cancelar, completar. |
| `calendario/fechas.ts`, `posicion.ts`, `constantes.ts` | Utilidades puras: semanas, fila y columna de una fecha, horario. |
| `tipos.ts` | Tipos del frontend, incluida la unión `Seleccion`. |
| `peticion.ts` | `pedir` / `pedirJson`: si la respuesta es un error, lanzan el mensaje del backend. |

- Solo se pintan las citas de la semana visible.
- Los botones de transición solo aparecen si `estado === "reservada"`.
- El `Panel` lleva `key` derivada de la selección para que el formulario nazca limpio al cambiar.
- BD y API en UTC; el navegador convierte a hora local solo para mostrar y para el `datetime-local`.
- Si una petición falla, el aviso sale dentro del panel si está abierto (que no se cierra), o encima del calendario si no. Tras una acción fallida se refrescan igualmente las citas.

## Verificado en v1.0

- Ida y vuelta de zona horaria al mover: se guarda 10:00 y se relee 10:00.
- Las tres transiciones responden bien en los tres caminos (éxito / 409 / 404).
