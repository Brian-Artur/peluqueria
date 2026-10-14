ALTER TABLE servicio
  ADD COLUMN tipo_recurso_id INT NULL,
  ADD CONSTRAINT fk_servicio_tipo_recurso FOREIGN KEY (tipo_recurso_id) REFERENCES tipo_recurso(id);
