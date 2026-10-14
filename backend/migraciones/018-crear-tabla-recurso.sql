CREATE TABLE recurso (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tipo_recurso_id INT NOT NULL,
  nombre VARCHAR(60) NOT NULL UNIQUE,
  fuera_de_servicio BOOLEAN NOT NULL DEFAULT FALSE,
  motivo VARCHAR(200) NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT fk_recurso_tipo FOREIGN KEY (tipo_recurso_id) REFERENCES tipo_recurso(id)
);
