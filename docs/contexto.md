# Contexto — dónde estoy

> **Este archivo se reescribe, no se amplía.** Solo el estado de ahora. Lo que deja de ser cierto se borra; la historia vive en los tags y commits de Git. Lo estable está en los demás documentos de `docs/`.

Actualizado: **12/10/2026**

| | |
|---|---|
| **Última versión cerrada** | `v1.0.0` (22/08/2026): agenda de una persona — crear, mover, cancelar y completar citas. |
| **En curso** | **v1.1: CSS Modules** — refactor puro, debe verse idéntico. Lo implementa Codex y lo revisa Claude. |
| **Siguiente** | v1.2: robustez (deuda de la auditoría, en el roadmap). |
| **Pendiente de mí** | Decidir cómo repartir `dev.artesaniaartur.es` antes del despliegue. Resto de decisiones abiertas en el roadmap. |

## Para retomar

```bash
docker compose -f infra/mariadb/docker-compose.yml up -d
cd backend && npm run dev        # y comprobar: curl http://127.0.0.1:3000/health
cd frontend && npm run dev       # http://127.0.0.1:5173
```

## Mapa

- [arquitectura.md](arquitectura.md) — cómo está construido hoy.
- [decisiones.md](decisiones.md) — lo cerrado, la deuda anotada y las lecciones de infraestructura.
- [roadmap.md](roadmap.md) — qué viene, en qué orden, y las decisiones abiertas.
- [dominio.md](dominio.md) — hacia dónde va el sistema: empleados, tiempos, recursos, motor de asignación, dinero, asistentes, plano.
- [`AGENTS.md`](../AGENTS.md) — cómo trabajan Claude y Codex en este repo, y cómo trabajo yo.

## Al cerrar una versión

1. Tag en Git.
2. Esta tabla: reescribir las cuatro filas.
3. [roadmap.md](roadmap.md): moverla a "Hecho" con una línea.
4. Si cambió cómo está construido algo, [arquitectura.md](arquitectura.md); si se tomó una decisión, [decisiones.md](decisiones.md).
