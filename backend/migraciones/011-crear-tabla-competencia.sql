CREATE TABLE competencia (
  empleado_id INT NOT NULL,
  servicio_id INT NOT NULL,
  nivel ENUM('aprendiz', 'autonomo', 'experto') NOT NULL,
  PRIMARY KEY (empleado_id, servicio_id),
  FOREIGN KEY (empleado_id) REFERENCES empleado(id),
  FOREIGN KEY (servicio_id) REFERENCES servicio(id)
);
