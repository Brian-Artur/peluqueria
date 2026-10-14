-- Semilla v1: datos de demostración inventados

-- El horario general ya viene de las migraciones; el resto sigue el año de las citas demo.
INSERT INTO temporada (nombre, desde, hasta, activa)
VALUES ('Verano', '2026-07-01', '2026-08-31', TRUE);
SET @verano = LAST_INSERT_ID();
INSERT INTO horario_tramo (temporada_id, dia_semana, abre, cierra) VALUES
  (@verano, 2, '08:00:00', '15:00:00'),
  (@verano, 3, '08:00:00', '15:00:00'),
  (@verano, 4, '08:00:00', '15:00:00'),
  (@verano, 5, '08:00:00', '15:00:00'),
  (@verano, 6, '08:00:00', '15:00:00');

INSERT INTO excepcion_horario (fecha, cerrado, motivo)
VALUES ('2026-08-15', TRUE, 'Festivo: Asunción');
INSERT INTO excepcion_horario (fecha, cerrado, motivo)
VALUES ('2026-07-12', FALSE, 'Bodas');
SET @bodas = LAST_INSERT_ID();
INSERT INTO excepcion_tramo (excepcion_id, abre, cierra)
VALUES (@bodas, '09:00:00', '14:00:00');

-- Solo para desarrollo: un usuario por rol, todos con contraseña demo1234.
-- Hashes generados con cifrarContrasena; cada contraseña tiene su propia sal.
INSERT INTO usuario (nombre_usuario, nombre, hash_contrasena, rol) VALUES
  ('admin', 'Administración demo', 'scrypt$3Hp/sfpiyn5NVUDupxW0qg==$f0biBqPAvVqj++yvIzPMRnnABfLsUDC/pljhG5lHYcGn8fhRzXFL8VfwH2qgcXSnYlo3Q8UQ2VD8MqOZUfnLgg==', 'admin'),
  ('encargado', 'Encargado demo', 'scrypt$zc3goVwng7hCQmF4yy1g8A==$sF0sBSIfySVnxPmn2tblgAcLM8dXUUenfSx2kp08O3JDrbfWbvLmlPuynSFaF1yfEdp96/UpwnX6JZ0ve59gjg==', 'encargado'),
  ('recepcion', 'Recepción demo', 'scrypt$RcfWINByqP64TkkLRxRnMQ==$YfSPGVBUesWQ8pdtP9sYp0ASPrkh+PPcOSdqNpaUlFnW4qcxolHodSR4m+owhLIEtVx//FLKbAekwAMoON5S0w==', 'recepcion'),
  ('empleado', 'Empleado demo', 'scrypt$ZUyOYFT39I1WerV4lf4Mjg==$jcbfhECNQMcIuS8/ghRJjCDhS5qXq+4jj6/LrBjPBJ1GnRH2MG7w4BnoJAFH0p+zGOLdIBFl+XIraMngwHBu5w==', 'empleado');

INSERT INTO cliente (nombre, telefono) VALUES
  ('María López',      '+34600111222'),
  ('Carlos Ruiz',      '+34600333444'),
  ('Lucía Fernández',  '+34600555666'),
  ('Javier Moreno',    NULL);

INSERT INTO categoria_servicio (nombre) VALUES
  ('Pelo'), ('Uñas'), ('Maquillaje'), ('Estética'), ('Depilación'), ('Masaje');

INSERT INTO tipo_recurso (nombre) VALUES
  ('Butaca'), ('Lavacabezas'), ('Mesa de uñas'), ('Camilla');

INSERT INTO recurso (nombre, tipo_recurso_id, fuera_de_servicio, motivo) VALUES
  ('Butaca 1', (SELECT id FROM tipo_recurso WHERE nombre = 'Butaca'), FALSE, NULL),
  ('Butaca 2', (SELECT id FROM tipo_recurso WHERE nombre = 'Butaca'), FALSE, NULL),
  ('Butaca 3', (SELECT id FROM tipo_recurso WHERE nombre = 'Butaca'), FALSE, NULL),
  ('Butaca 4', (SELECT id FROM tipo_recurso WHERE nombre = 'Butaca'), TRUE, 'En reparación: fallo en el elevador'),
  ('Lavacabezas 1', (SELECT id FROM tipo_recurso WHERE nombre = 'Lavacabezas'), FALSE, NULL),
  ('Lavacabezas 2', (SELECT id FROM tipo_recurso WHERE nombre = 'Lavacabezas'), FALSE, NULL),
  ('Mesa de uñas 1', (SELECT id FROM tipo_recurso WHERE nombre = 'Mesa de uñas'), FALSE, NULL),
  ('Camilla 1', (SELECT id FROM tipo_recurso WHERE nombre = 'Camilla'), FALSE, NULL);

INSERT INTO servicio (nombre, categoria_id, tipo_recurso_id, duracion_min, margen_min, dificultad, precio) VALUES
  ('Corte de pelo', (SELECT id FROM categoria_servicio WHERE nombre = 'Pelo'),
    (SELECT id FROM tipo_recurso WHERE nombre = 'Butaca'), 30, 5, 'media', 15.00),
  ('Manicura', (SELECT id FROM categoria_servicio WHERE nombre = 'Uñas'),
    (SELECT id FROM tipo_recurso WHERE nombre = 'Mesa de uñas'), 45, 5, 'baja', 20.00),
  ('Depilación láser', (SELECT id FROM categoria_servicio WHERE nombre = 'Depilación'),
    (SELECT id FROM tipo_recurso WHERE nombre = 'Camilla'), 45, 10, 'alta', 50.00);

INSERT INTO empleado (nombre, telefono, email, usuario_id, activo) VALUES
  ('Ana Martín', '+34610111222', 'ana@example.com', (SELECT id FROM usuario WHERE nombre_usuario = 'empleado'), TRUE),
  ('Beatriz Soto', '+34610333444', 'beatriz@example.com', NULL, TRUE),
  ('Clara Gil', NULL, 'clara@example.com', NULL, TRUE),
  ('Diego Vega', '+34610555666', 'diego@example.com', NULL, TRUE),
  ('Elena Ruiz', NULL, NULL, NULL, FALSE);

SET @ana = (SELECT id FROM empleado WHERE nombre = 'Ana Martín');
SET @beatriz = (SELECT id FROM empleado WHERE nombre = 'Beatriz Soto');
SET @clara = (SELECT id FROM empleado WHERE nombre = 'Clara Gil');
SET @diego = (SELECT id FROM empleado WHERE nombre = 'Diego Vega');
SET @elena = (SELECT id FROM empleado WHERE nombre = 'Elena Ruiz');

INSERT INTO contrato_empleado (empleado_id, tipo, desde, hasta, tutor_id, empresa) VALUES
  (@ana, 'plantilla', '2025-01-01', NULL, NULL, NULL),
  (@beatriz, 'prueba', '2026-01-01', '2026-03-31', NULL, NULL),
  (@beatriz, 'plantilla', '2026-04-01', NULL, NULL, NULL),
  (@clara, 'practicas', '2026-09-01', NULL, @ana, NULL),
  (@diego, 'externo', '2026-02-01', NULL, NULL, 'Láser Demo'),
  (@elena, 'plantilla', '2025-02-01', '2026-08-31', NULL, NULL);

SET @corte = (SELECT id FROM servicio WHERE nombre = 'Corte de pelo');
SET @manicura = (SELECT id FROM servicio WHERE nombre = 'Manicura');
SET @laser = (SELECT id FROM servicio WHERE nombre = 'Depilación láser');

INSERT INTO competencia (empleado_id, servicio_id, nivel, duracion_min, margen_min) VALUES
  (@ana, @corte, 'experto', 25, 0),
  (@ana, @manicura, 'autonomo', NULL, 5),
  (@beatriz, @corte, 'autonomo', NULL, 0),
  (@beatriz, @manicura, 'experto', 35, 0),
  (@clara, @corte, 'aprendiz', 50, 10),
  (@clara, @manicura, 'aprendiz', 60, 10),
  (@diego, @laser, 'experto', NULL, 0),
  (@elena, @manicura, 'autonomo', NULL, 0);

-- Citas repartidas en una semana. inicio + fin coherentes con la duración
-- del servicio, pero congelados en la propia cita (patrón snapshot).
-- Los DATETIME están en UTC; en julio, la hora de España peninsular es UTC +2 h.
INSERT INTO cita (cliente_id, servicio_id, inicio, fin, estado) VALUES
  (1, 1, '2026-07-06 08:00:00', '2026-07-06 08:30:00', 'reservada'),
  (2, 2, '2026-07-06 09:00:00', '2026-07-06 09:45:00', 'reservada'),
  (3, 1, '2026-07-07 07:30:00', '2026-07-07 08:00:00', 'completada'),
  (1, 2, '2026-07-08 14:00:00', '2026-07-08 14:45:00', 'reservada'),
  (4, 1, '2026-07-09 10:00:00', '2026-07-09 10:30:00', 'cancelada'),
  (2, 1, '2026-07-10 15:00:00', '2026-07-10 15:30:00', 'reservada');
