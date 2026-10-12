# Dominio — hacia dónde va el sistema

> Propuesta de diseño, **no decisiones cerradas**. Cada bloque se abre como decisión propia cuando le toque en el [roadmap](roadmap.md). Lo cerrado vive en [decisiones.md](decisiones.md); lo que existe hoy, en [arquitectura.md](arquitectura.md).

## La pregunta central

Todo el sistema gira alrededor de una pregunta:

> **¿Qué empleado atiende a este cliente, con qué recurso y cuándo?**

La respuesta depende sobre todo del **tratamiento**. De él salen quién sabe hacerlo, cuánto tarda *esa persona*, qué recurso físico ocupa (butaca, lavacabezas, camilla…) y si hace falta más de un empleado. Dinero, stock, asistentes y plano son módulos que se apoyan en esa respuesta; ninguno la sustituye.

## El salón que modelamos

- Plantilla con distintos perfiles: **fijos**, **en prueba** y **en prácticas**. Unos son más rápidos, otros más finos; unas personas son mejores con uñas o maquillaje que con un degradado.
- **Servicios subcontratados**: depilación láser y quizá masaje facial y de pies. Profesional externo que viene días concretos, no con turno semanal.
- No solo pelo: uñas, maquillaje, estética, láser, masaje.
- **X butacas**, lavacabezas, camillas, mesa de uñas: recursos físicos que se agotan.
- **Bloqueos**: sobre todo en verano, franjas reservadas para bodas y eventos (fuera del salón o dentro), que inutilizan empleados y/o recursos.

## Bloques del modelo

### 1. Personas

- **empleado**: nombre, contacto, `relacion` (`plantilla` / `prueba` / `practicas` / `externo`), fechas de alta y fin, activo. Los de prácticas pueden tener `tutor_id` → otro empleado.
- **externo**: es un empleado con `relacion = externo` y `proveedor_id` (la empresa que lo manda). Así el motor de asignación lo trata igual que a cualquiera; lo que cambia es su disponibilidad (por fechas, no por semana) y cómo se reparte el dinero.
- **cliente**: lo que ya hay + teléfono **normalizado** (E.164, `+34…`). Es la pista con la que los asistentes reconocerán a quien llama o escribe, pero **no es único**: una madre pide cita para sus hijos desde su móvil. Un teléfono puede llevar a varios clientes y el asistente pregunta "¿para quién?". Preferencias ("siempre con Marta"), notas, consentimiento RGPD.

### 2. Catálogo de tratamientos

- **servicio**: nombre, categoría (pelo, uñas, maquillaje, estética, láser, masaje), duración base, precio, `tipo_recurso` que ocupa, nº de empleados necesarios.
- **fases**: un tinte no es un bloque uniforme. Aplicar (activa, butaca) → reposo (pasiva, butaca) → lavado (activa, lavacabezas). En medio, **revisiones**: echar un vistazo al tinte por si quema, sin estar encima; ocupan al empleado un momento, no toda la fase. Cada fase ocupa su propio recurso: el lavacabezas solo está ocupado durante el lavado. Invariante: **procesos activos simultáneos ≤ empleados disponibles**; los pasivos solo los limitan los recursos.
  - Se puede empezar con servicios de un solo bloque continuo, pero **sin fases no se pueden prometer solapes fiables** (atender a otra clienta durante un reposo). Las fases van antes de presumir de eso.
- **precedencias** entre tratamientos de una misma cita: lavado antes de corte; algunos no se pueden hacer a la vez sobre la misma persona.

### 3. Competencias y tiempos — el corazón

Es la parte más específica del proyecto y la que no resuelve ningún software genérico.

**`empleado_servicio`** — una fila por (empleado, servicio) que sabe hacer:

| campo | para qué |
|---|---|
| `nivel` | `aprendiz` / `autonomo` / `experto`. Sirve para ordenar candidatos y para filtrar (aprendiz no va solo). |
| `requiere_supervision` | prácticas: ocupa también a un tutor durante las fases activas. |
| `duracion_ajustada_min` | lo que **el encargado** dice que tarda esta persona. `NULL` = usa la base del servicio. |
| `margen_min` | colchón para retrasos. Se suma al final, no se esconde dentro de la duración. |
| `preferente` | a quién se le asigna antes si hay empate. |
| `actualizado_por`, `actualizado_en` | quién tocó el dato y cuándo: el encargado debe poder ver de dónde sale cada número. |

**Duración que se agenda** = `COALESCE(duracion_ajustada_min, servicio.duracion_base)` + `margen_min`.

**Aprender del ritmo real, sin que el sistema decida solo:**

- Cada línea de cita guarda `inicio_real` y `fin_real`, marcados por una persona (botones "empiezo" / "termino", o al completar).
- Se mide **duración real**, no el desfase contra la agenda. Si el cliente llega 15 min tarde, eso no hace más lento al empleado.
- Ojo: `fin_real − inicio_real` no es "lo que tarda el empleado". Puede incluir reposos, esperas de lavacabezas, interrupciones o ayuda del tutor. Cuando existan fases, lo que se compara es el **tiempo de las fases activas**.
- No todos los clientes son iguales: un pelo largo y denso tarda más. Cada línea puede llevar una **complejidad** sencilla (`normal` / `larga` / `extra`) para comparar casos parecidos. Si no, el experto al que le mandan los casos difíciles parecerá el más lento.
- El sistema calcula una **sugerencia** por (empleado, servicio, complejidad): la mediana de las últimas N realizadas. Mediana y no media: un caso excepcional no debe arrastrar el número. Se muestra con **cuántas muestras** hay y cuánto varían; por debajo de un mínimo, no se sugiere nada y se mantiene la base.
- La sugerencia se **muestra** al encargado junto al valor vigente ("Marta: 45 min ajustado · 38 min mediana de 12 casos"). **El encargado acepta, edita o ignora. Nunca se sobrescribe sola.** Es el mismo criterio que `completada`: el sistema mide, la persona decide.
- Cada cambio manual queda registrado (quién, cuándo, de cuánto a cuánto). Cada cita guarda la duración que se le aplicó al reservarla: cambiar el ajuste no mueve citas ya dadas.
- Hay que definir qué cubre el `margen_min` (¿retraso, limpieza del puesto, cambio de cliente?) para no contarlo dos veces.
- Al principio no habrá datos: todo arranca con la duración base y el ajuste manual. Es lo esperable en un salón que nunca ha medido nada.

### 4. Recursos físicos

- **tipo_recurso**: butaca, lavacabezas, camilla, mesa de uñas, cabina.
- **recurso**: cada unidad física, con nombre ("Butaca 3"). Contable: tres butacas = tres filas.
- Más adelante cada recurso tendrá posición en el plano (bloque 9). El plano dibuja estas filas; no las duplica.

### 5. Tiempo: horarios, turnos, ausencias, bloqueos

- **horario_local**: tramos por día de la semana (mañana y tarde son dos filas) + **excepciones por fecha** (festivo, horario de verano, apertura especial).
- **turno**: horario de cada empleado. Recurrente (día de la semana) para la plantilla; puntual (fecha concreta) para externos.
- **ausencia**: vacaciones, baja, formación. Rango de fechas.
- **bloqueo**: franja con motivo (boda, evento, formación interna) que afecta al local entero, a empleados concretos y/o a recursos concretos. Ejemplo: sábado de 8 a 12, Ana y Lucía + 2 butacas, "boda Pérez". Bloquear no borra citas existentes: avisa de las que chocan y una persona decide qué hacer con ellas.

### 6. Agenda: cabecera y líneas

- **cita** pasa a ser el *sobre*: cliente, estado global, ventana en el local (su `fin` es el máximo de los `fin` de sus líneas), `origen` (`mostrador` / `telefono` / `telegram` / `whatsapp` / `asistente_voz`).
- **cita_servicio**: cada tratamiento dentro de la cita, con su recurso, `inicio`/`fin` planificados, `inicio_real`/`fin_real`, y **duración y precio congelados** (snapshot, como hoy el `fin`). Permite uñas y tinte en paralelo con dos personas.
- **participantes** de cada línea: no basta con un `empleado_id`. Un recogido de novia puede llevar dos personas, y una alumna en prácticas lleva a su tutor. Cada participante tiene función (`principal` / `ayudante` / `tutor`) y su propio intervalo. Del tutor hay que comprobar que sabe hacer el servicio y que está libre, no solo que "hay alguien libre".
- Estados nuevos: `no_asistio` (prerrequisito de cualquier automatismo por reloj) y `solicitada` (la crea un asistente y la confirma una persona). Hay que fijar **qué estados ocupan capacidad** (`reservada` sí, `cancelada` no, ¿`solicitada`?).
- Intervalos **semiabiertos** `[inicio, fin)`: una cita que acaba a las 10:00 no choca con otra que empieza a las 10:00.
- **Retrasos en cascada**: si a media mañana todo va 20 min tarde, el sistema puede **proponer** reajustar las citas siguientes, pero no mover nada solo. Propuesta → una persona acepta → se avisa al cliente afectado.
- Migración desde v1 no destructiva: cada cita vieja genera una línea sin participantes, conservando `inicio`/`fin`. El precio histórico no existe: no se inventa, se deja vacío.

### 7. Motor de asignación

Una **función pura** en el backend: datos dentro, candidatos fuera. Sin SQL ni HTTP dentro, para poder probarla con tests sin base de datos.

- **Entrada**: tratamiento(s), ventana deseada, preferencia de empleado opcional.
- **Filtra**: competencia → turno y horario del local → ausencias y bloqueos → solapes de procesos activos → recurso libre del tipo necesario.
- **Ordena**: preferencia del cliente > nivel > equilibrio de carga del día > menos huecos muertos.
- **Salida**: lista de huecos `(empleado, recurso, inicio, fin)` con el **motivo** de cada uno ("Marta: experta, libre, butaca 2").
- **Sugiere, no impone.** Recepción elige; los asistentes proponen al cliente y crean citas `solicitada`.

El mismo motor sirve a la pantalla de crear cita, a la validación del arrastrar-y-soltar y a los asistentes. Por eso va antes que todos ellos.

**Al guardar se vuelve a comprobar**, dentro de una transacción. Entre que el motor sugiere un hueco y alguien pulsa "reservar", otra persona (o un asistente) puede haberlo ocupado. Dos reservas simultáneas no pueden quedarse con la misma butaca o la misma persona.

### 8. Dinero, stock y proveedores

- **venta** (ticket) + **linea_venta** (servicio o producto, precio congelado, empleado que lo hizo → comisiones), **pago** (efectivo / tarjeta / Bizum), **caja** diaria (apertura, cierre, arqueo), **gasto**.
- **proveedor**: de productos (tintes, champús) y de servicios (la empresa del láser).
- **acuerdo con externos**: cómo se reparte lo que cobra un servicio subcontratado (porcentaje o importe fijo), con fechas de vigencia, porque el trato puede cambiar y las ventas viejas deben conservar el reparto que tenían.
- **producto**: uso `venta` / `consumo` / ambos, unidad, stock mínimo, proveedor.
- **movimiento_stock**: compra, venta, consumo en servicio, ajuste. **El stock actual es la suma de movimientos, no una columna que se pisa**: mismo espíritu que el snapshot de la cita, el histórico no se reescribe.
- ⚠️ **Antes de emitir tickets o facturas reales**: en España el software de facturación debe cumplir el reglamento de sistemas informáticos de facturación (**VERI\*FACTU**, RD 1007/2023), con obligatoriedad en 2027 (comprobar fechas vigentes). Mientras sea demo no aplica; si un salón real lo usa para cobrar, sí.

### 9. Plano del local (lo último)

- **elemento_plano**: tipo (butaca, lavacabezas, camilla, caja, almacén, tintes, herramientas, pared, puerta), `x`, `y`, `ancho`, `alto`, `rotacion`, y `recurso_id` cuando el elemento *es* un recurso.
- **puesto_jornada**: qué empleado está en qué puesto cada día.
- No tiene que ser bonito: tiene que entenderse. Tecnología por decidir (ver "Librerías").

### 10. Asistentes de mensajes y de voz (futuro)

Los tres canales son **clientes del mismo backend**; ninguno tiene lógica de agenda propia.

1. Reconocer al cliente por teléfono normalizado.
2. Entender qué quiere (tratamiento, cuándo, con quién).
3. Preguntar al motor de asignación → proponer 2-3 huecos.
4. Crear la cita en estado `solicitada` → aviso al personal → confirmación al cliente.

Orden recomendado por dificultad: **Telegram** (API de bots gratuita y directa, ideal de prototipo) → **WhatsApp** (WhatsApp Business Platform de Meta: verificación del negocio, plantillas, coste por conversación) → **llamadas** (proveedor de telefonía + voz en tiempo real; el más caro y frágil).

Prerrequisitos: motor de asignación expuesto como API, teléfono normalizado, estado `solicitada`, autenticación del personal, y RGPD (avisar de grabación y tratamiento, base legal, plazo de conservación).

### 11. Más allá

- **Estadísticas**: % de cancelaciones y de no presentados, ocupación por empleado y recurso, tiempo real frente a estimado. La pregunta práctica a media mañana: "¿vamos tarde?, ¿llamo a quien libraba?".
- **Zona de espera y cola**: quien entra sin cita, cuánto le queda y con quién.

## Librerías

- **Arrastrar citas**: [`dnd-kit`](https://dndkit.com) es la opción natural. No impone estilos (encaja con CSS Modules y con la rejilla hecha a mano), soporta ratón, táctil y teclado, y tiene *modifiers* para ajustar a la franja de 5 min. Alternativas: `pragmatic-drag-and-drop` (Atlassian; más bajo nivel, basado en el drag nativo del navegador, táctil más flojo) y `react-dnd` (veterana, menos activa). **Descartado**: FullCalendar y similares, porque sustituyen el calendario hecho a mano (decisión cerrada).
- **Plano**: dos caminos razonables, a decidir en v7.
  - SVG a mano + `dnd-kit`: control total y nada nuevo que aprender, pero zoom, desplazamiento y redimensionar piezas hay que escribirlos.
  - **React Flow** (`@xyflow/react`, MIT): pensado para nodos y conexiones, pero sirve para piezas sueltas sobre un lienzo. Trae zoom, desplazamiento, ajuste a rejilla, selección y redimensionado. Sus nodos son componentes React normales, así que se estilan con CSS Modules.
- **Descartadas** para este proyecto: **JointJS** (núcleo MPL; lo potente está en JointJS+, de pago por desarrollador; no es React de origen), **VisuallyJs** (sucesor comercial de jsPlumb, de pago) y **Workflow Builder** (de Synergy Codes, montado sobre React Flow; es un editor de flujos de trabajo, no aporta nada a un plano). Todas son librerías de diagramas, no de arrastrar citas a una rejilla.
- **Tests del motor**: Vitest (ya va con Vite y entiende TypeScript sin configuración extra).
