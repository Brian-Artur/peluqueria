-- Semilla v1: datos de demostración inventados

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

INSERT INTO servicio (nombre, duracion_min, precio) VALUES
  ('Corte de pelo', 30, 15.00),
  ('Manicura',      45, 20.00);

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
