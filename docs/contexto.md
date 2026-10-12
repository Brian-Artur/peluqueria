# Contexto — dónde estoy

> **Este archivo se reescribe, no se amplía.** Solo el estado de ahora. Lo que deja de ser cierto se borra; la historia vive en los tags y commits de Git. Lo estable está en los demás documentos de `docs/`.

Actualizado: **12/10/2026**

| | |
|---|---|
| **Última versión cerrada** | `v1.3.0` (12/10/2026): pulido estético — paleta ciruela, tarjetas legibles, calendario a todo el alto, días de apertura y semana ISO. |
| **En curso** | Nada. |
| **Siguiente** | **v1.4: selector de fecha/hora propio** — el `datetime-local` sale en formato US con el navegador en inglés; franjas de 5 min al crear. |
| **Pendiente de mí** | Hacer push de `main` y los tags. Decidir cómo repartir `dev.artesaniaartur.es` antes del despliegue. |

## Para retomar

```bash
docker compose -f infra/mariadb/docker-compose.yml up -d
cd backend && npm run dev        # y comprobar: curl http://127.0.0.1:3100/health
cd frontend && npm run dev       # http://127.0.0.1:5180
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
