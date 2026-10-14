CREATE TABLE historial_tiempo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  empleado_id INT NOT NULL,
  servicio_id INT NOT NULL,
  campo ENUM('duracion', 'margen') NOT NULL,
  valor_anterior INT NULL,
  valor_nuevo INT NULL,
  usuario_id INT NOT NULL,
  cambiado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (empleado_id) REFERENCES empleado(id),
  FOREIGN KEY (servicio_id) REFERENCES servicio(id),
  FOREIGN KEY (usuario_id) REFERENCES usuario(id)
);
