ALTER TABLE servicio
  ADD COLUMN categoria_id INT NULL,
  ADD CONSTRAINT fk_servicio_categoria FOREIGN KEY (categoria_id) REFERENCES categoria_servicio(id);
