# Contexto — dónde estoy

> **Este archivo se reescribe, no se amplía.** Solo el estado de ahora. Lo que deja de ser cierto se borra; la historia vive en los tags y commits de Git. Lo estable está en los demás documentos de `docs/`.

Actualizado: **13/10/2026**

| | |
|---|---|
| **Última versión cerrada** | `v3.0.0` (13/10/2026): clientes — pantalla, búsqueda, alta rápida, teléfonos con prefijo. **Series v2 y v3 completas.** |
| **En curso** | Nada. |
| **Siguiente** | **v4: plantilla, tiempos y local**, empezando por **v4.0 usuarios y roles** (el encargado ajusta tiempos y bloqueos). |
| **Pendiente de mí** | Nada urgente. El despliegue queda aparcado (el Windows de bot_trading va justo). |

## Para retomar

```bash
npm install                      # desde la raíz, si cambiaron dependencias
docker compose -f infra/mariadb/docker-compose.yml up -d
cd backend && npm run migrar     # por si hay migraciones nuevas
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
