# Peluquería — sistema de gestión para un salón

Agenda, clientes, empleados, servicios y (más adelante) dinero, stock y asistentes por mensaje y teléfono para un salón de peluquería y estética.

Monorepo con npm workspaces: `compartido/` (contratos de la API), `backend/` (Express + MariaDB) y `frontend/` (React + Vite).

- Estado y siguiente paso: [`docs/contexto.md`](docs/contexto.md)
- Cómo está hecho y por qué: [`docs/`](docs/) — arquitectura, decisiones, roadmap y dominio
- Instrucciones para Claude y Codex: [`AGENTS.md`](AGENTS.md)

## Arrancar (día a día)

Tres terminales, desde la raíz del repo:

```bash
docker compose -f infra/mariadb/docker-compose.yml up -d   # base de datos (127.0.0.1:3305)
```

```bash
cd backend && npm run migrar && npm run dev                # API en http://127.0.0.1:3100
```

```bash
cd frontend && npm run dev                                 # app en http://127.0.0.1:5180
```

Comprobar que el backend llega a la base de datos: `curl http://127.0.0.1:3100/health`.

## Usuarios de prueba (solo desarrollo)

Los crea `npm run sembrar` junto con los datos de ejemplo. Contraseña de todos: `demo1234`.

| Usuario | Rol | Puede |
|---|---|---|
| `admin` | Admin | Todo, y gestionar usuarios |
| `encargado` | Encargado | Todo lo del salón |
| `recepcion` | Recepción | Agenda y clientes completos |
| `empleado` | Empleado | Ver agenda y clientes, completar citas |

## Montar desde cero (otra máquina o base de datos nueva)

1. Dependencias de los tres paquetes, desde la raíz:

   ```bash
   npm install
   ```

2. Credenciales, fuera del repo (no se suben a Git):
   - `infra/mariadb/db.env`: `MARIADB_ROOT_PASSWORD`, `MARIADB_DATABASE`, `MARIADB_USER`, `MARIADB_PASSWORD`.
   - `backend/.env`: `DB_HOST=127.0.0.1`, `DB_PORT=3305`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (los mismos que arriba) y `PORT=3100`.

3. Volumen y contenedor de MariaDB:

   ```bash
   docker volume create mariadb_peluqueria_data
   docker compose -f infra/mariadb/docker-compose.yml up -d
   ```

4. Esquema, datos de ejemplo y tu usuario:

   ```bash
   cd backend
   npm run migrar          # crea o actualiza las tablas
   npm run sembrar         # datos de ejemplo y usuarios demo (se niega si ya hay clientes)
   npm run crear-usuario   # tu usuario real; pide la contraseña sin mostrarla
   ```

## Comandos

| Dónde | Comando | Para qué |
|---|---|---|
| raíz | `npm install` | Instalar dependencias de los tres paquetes |
| raíz | `npm test` | Todos los tests (Vitest) |
| raíz | `npm run typecheck` | Comprobar tipos en los tres paquetes |
| raíz | `npm run lint` | Lint del frontend |
| `backend/` | `npm run dev` | API con recarga automática (no relee `.env`: reiniciar tras editarlo) |
| `backend/` | `npm run migrar` | Aplicar migraciones pendientes de `backend/migraciones/` |
| `backend/` | `npm run sembrar` | Datos de ejemplo y usuarios demo |
| `backend/` | `npm run crear-usuario` | Crear un usuario |
| `frontend/` | `npm run dev` | App con recarga automática |
| `frontend/` | `npm run build` | Compilar para producción (`frontend/dist/`) |

## Cambiar el esquema de la base de datos

Siempre con una migración nueva en `backend/migraciones/` (`NNN-descripcion.sql`, siguiente número libre), **un solo cambio por archivo**, y `npm run migrar`. Nunca editar una migración ya aplicada.

## Puertos

| Servicio | Puerto |
|---|---|
| MariaDB | 3305 |
| Backend | 3100 |
| Frontend | 5180 (fijo: si está ocupado, falla en vez de cambiar) |

Elegidos para no chocar con otros proyectos de la misma máquina (bot_trading usa 3000 y 3306; tramas, 4000 y 3307).
