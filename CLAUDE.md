@AGENTS.md

# Solo para Claude

Las instrucciones del proyecto están en `AGENTS.md` (importado arriba) y el estado en `docs/contexto.md`. Aquí solo va lo específico de Claude Code.

## Trabajar con Codex

El usuario quiere que Codex asuma una parte equivalente del trabajo. Por defecto, **lo que en la tabla de `AGENTS.md` es de Codex se delega, no se hace a mano.**

- Delegar: subagente `codex:codex-rescue` (o `/codex:rescue`). En segundo plano si no bloquea lo siguiente.
- Revisar lo que escribió Claude: `/codex:review` (diff local) o `/codex:adversarial-review` (cuestiona el enfoque, útil en diseño).
- Seguimiento: `/codex:status`, `/codex:result`, `/codex:cancel`.
- El prompt para Codex se escribe autosuficiente: objetivo, archivos, restricciones relevantes de `AGENTS.md`, criterio de hecho y "no hagas commit".
- Para auditorías o críticas, pedir explícitamente **solo lectura**.
- Lo que devuelve Codex se revisa antes de presentarlo: se comprueban sus afirmaciones importantes (comandos, archivo:línea) en vez de repetirlas.
- Si Codex y Claude discrepan en algo de diseño, se le presenta al usuario como bifurcación; no se elige en silencio.
- El sandbox de Codex **no tiene red** (configuración por defecto, a propósito): `npm install`, `npm audit` y búsquedas web los hace Claude. En tareas de solo lectura además no puede escribir nada, ni `tsbuildinfo`: si hace falta `npm run build`, o se le da una tarea de escritura o lo ejecuta Claude.

## Bóveda personal

Desde el 12/10/2026 toda la documentación del proyecto vive en este repo. La bóveda `~/Documentos/Boveda/` solo tiene una nota-puntero (`10-Proyectos/peluqueria/peluqueria.md`) y las notas antiguas en `99-Papelera/peluqueria-*`. No escribir estado del proyecto allí.
