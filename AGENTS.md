# AGENTS.md — instrucciones para agentes (Codex, Claude y cualquier otro)

Archivo compartido. Claude lo importa desde `CLAUDE.md`; Codex lo lee directamente. Lo que valga para los dos va aquí, no duplicado.

## El proyecto

Sistema de gestión para un salón de peluquería y estética: agenda, clientes, tratamientos, empleados, horarios, recursos físicos, stock, proveedores y dinero. A futuro, asistentes por Telegram, WhatsApp y teléfono que tomen citas.

- **Estado actual** → [`docs/contexto.md`](docs/contexto.md). Léelo antes de proponer nada. Es un tablero corto que **se reescribe, no se amplía**.
- **Documentación** en `docs/` (es también una bóveda de Obsidian):
  - [`arquitectura.md`](docs/arquitectura.md) — cómo está construido hoy.
  - [`decisiones.md`](docs/decisiones.md) — decisiones cerradas, deuda anotada y lecciones de infraestructura.
  - [`roadmap.md`](docs/roadmap.md) — versiones, deuda pendiente y decisiones abiertas.
  - [`dominio.md`](docs/dominio.md) — hacia dónde va el modelo de datos. Propuesta, no algo decidido.
- En `docs/` los enlaces son markdown relativos (`[texto](archivo.md)`), no `[[wikilinks]]`, e imágenes en `docs/_assets/`. No tocar `docs/.obsidian/` salvo que el usuario lo pida.

Proyecto de aprendizaje de un estudiante de primero de DAW (base en Java, nivel básico; objetivo: empleo full-stack): el código tiene que poder entenderlo y retomarlo él. Claridad por encima de ingenio.

## Idioma

Español en todo: identificadores de dominio (`cita`, `servicio`, `lunesVisible`), comentarios, mensajes de commit, documentación y respuestas. Inglés solo donde lo impone una librería.

## Stack

- **Backend** (`backend/`): Node 24, Express 5, TypeScript, Zod 4, mysql2. CommonJS. Puerto 3000.
- **Frontend** (`frontend/`): React 19, Vite, TypeScript, `Date` nativo. Puerto 5173, proxy `/api` → `127.0.0.1:3000`.
- **BD** (`infra/mariadb/`): MariaDB 12 en Docker, `127.0.0.1:3305`. Esquema y semilla en `initdb/` (solo se ejecutan con el volumen vacío).
- Sin tests todavía. Sin sistema de migraciones todavía.

## Comandos

```bash
# Base de datos (desde la raíz)
docker compose -f infra/mariadb/docker-compose.yml up -d
curl http://127.0.0.1:3000/health        # comprueba backend + BD

# Backend
cd backend && npm run dev                # tsx watch
cd backend && npx tsc --noEmit -p .      # comprobar tipos (no hay script)

# Frontend
cd frontend && npm run dev
cd frontend && npm run lint
cd frontend && npm run build             # tsc -b && vite build
```

- `tsx watch` no relee `.env`: tras editarlo, reiniciar el proceso.
- Usar `127.0.0.1`, nunca `localhost` (Node 24 resuelve primero a IPv6).
- Credenciales en `backend/.env` y `infra/mariadb/db.env`, fuera del repo. No leerlas ni imprimirlas.

## Estructura

```
backend/src/
  index.ts              arranque y montaje (/health en la raíz, el resto bajo /api)
  db.ts                 pool mysql2
  errores.ts            ErrorNoEncontrado (404), ErrorConflicto (409)
  middleware/errores.ts traduce errores a HTTP; se monta el último
  routes/               HTTP + validación Zod. Nada de SQL aquí (excepción: el SELECT 1 de health.ts)
  services/             reglas de negocio. Nada de HTTP ni SQL aquí
  repositories/         solo SQL parametrizado
frontend/src/
  Calendario.tsx        dueño del estado (citas, clientes, servicios, semana, selección) y de los fetch
  tipos.ts              tipos compartidos del frontend
  calendario/           componentes de la rejilla y el panel + utilidades puras (fechas, posicion, constantes)
infra/mariadb/          docker-compose + initdb/01-schema.sql, 02-seed.sql
docs/                   documentación + bóveda de Obsidian (.obsidian/, _assets/)
```

## Reglas de código

Prioridad: **escalabilidad y facilidad para retomar** por encima de brevedad. Escalar = añadir archivos, no añadir indirección.

- Un archivo por caso de uso, no por entidad.
- Tipo de retorno explícito en todo lo exportado.
- Zod en la frontera; `z.infer` como tipo. Una sola definición de la forma del dato.
- Cada capa traduce: la fila de MariaDB no llega a React.
- Regla de tres antes de abstraer.
- Comentarios de **por qué**, nunca de qué.
- Nada de ternarios anidados ni cadenas largas de `.map().filter()`. Early returns y variables intermedias con nombre.
- SQL siempre parametrizado.

### Estilos

- **CSS Modules**: `Componente.module.css` junto a `Componente.tsx`, importado como `styles`.
- **Prohibido** Tailwind, Bootstrap, CSS-in-JS y librerías de componentes con estilos propios.
- `index.css` solo para lo realmente global: reset y variables (`--color-…`, `--espacio-…`).
- El calendario es CSS Grid escrito a mano. No sustituirlo por una librería de calendario.

## Decisiones cerradas

Están en [`docs/decisiones.md`](docs/decisiones.md). **No se re-litigan de paso.** Si una parece mal, se señala y se pregunta; no se cambia en el mismo diff que otra cosa.

## Cómo trabajar con el usuario

- Respuestas breves. Sin explicaciones largas salvo que las pida.
- **Sin analogías con Java ni Spring**: no le ayudan.
- Aprende con dibujos (Excalidraw): si un esquema aclara algo, ofrécelo. Los diagramas del proyecto van en `docs/_assets/`.
- **Una decisión de arquitectura a la vez**, presentada como bifurcación con causa-efecto: qué se rompe si se elige cada opción.
- El usuario verifica cada paso antes de seguir. Cambios pequeños y comprobables, no lotes grandes.
- Patrones que él mismo vigila: abandonar en el "barro del medio" cuando lo nuevo brilla más, y cargar funcionalidades futuras antes de tiempo. Si lo ves pasar, dilo.
- No adelantar trabajo de una versión posterior del roadmap. Si surge, se anota en `docs/roadmap.md` y se sigue con lo actual.
- Usa dictado por voz: si una palabra no encaja, probablemente es un error de transcripción. Interpretar con sentido común y preguntar si cambia el significado.
- Al mostrarle código, como contenido de archivo completo o fragmento claro, no metido en un `cat <<EOF` de bash.

## Git

- Conventional commits en español: `feat(frontend): …`, `fix(backend): …`, `refactor`, `chore`, `docs`.
- Un commit = un paso verificable.
- **No hacer commit ni push sin que el usuario lo pida.** Nunca reescribir historia publicada.

## Verificar antes de dar algo por hecho

1. Tipos: backend `npx tsc --noEmit -p .`; frontend `npx tsc --noEmit -p tsconfig.app.json` y `-p tsconfig.node.json` (su `tsconfig.json` solo tiene referencias).
2. Lint del frontend: `npm run lint`.
3. Backend: `curl` al endpoint con los tres caminos (éxito / 409 / 404).
4. Frontend: decir qué comprobar en el navegador; no afirmar que se ve bien sin haberlo visto.

Si algo no se pudo comprobar, se dice explícitamente.

## Reparto entre Claude y Codex

El usuario trabaja con los dos y quiere repartir la carga a partes iguales.

| Tarea | Quién |
|---|---|
| Hablar con el usuario, abrir decisiones, diseño y modelo de datos | Claude |
| Implementar una tarea ya decidida y acotada (archivos y criterio de hecho claros) | Codex |
| Refactors mecánicos (p. ej. migrar a CSS Modules), tests, scripts | Codex |
| Auditorías, búsquedas amplias, diagnóstico de bugs | Codex |
| Revisar el diff del otro antes de que el usuario lo vea | el que no lo escribió |
| Documentación (`docs/`) | Claude, con revisión de Codex si es diseño |

Reglas del reparto:

- Una tarea para Codex debe poder hacerse sin preguntar: objetivo, archivos, restricciones de este documento y cómo verificar.
- Codex **no** toma decisiones de arquitectura ni cambia el esquema por su cuenta: si encuentra una bifurcación, para y la describe.
- Quien termina una tarea informa de qué cambió, qué verificó y qué no pudo verificar.
