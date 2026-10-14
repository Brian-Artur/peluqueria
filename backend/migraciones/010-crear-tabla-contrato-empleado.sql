CREATE TABLE contrato_empleado (
  id INT AUTO_INCREMENT PRIMARY KEY,
  empleado_id INT NOT NULL,
  tipo ENUM('plantilla', 'prueba', 'practicas', 'externo') NOT NULL,
  desde DATE NOT NULL,
  hasta DATE NULL,
  tutor_id INT NULL,
  empresa VARCHAR(120) NULL,
  FOREIGN KEY (empleado_id) REFERENCES empleado(id),
  FOREIGN KEY (tutor_id) REFERENCES empleado(id)
);
