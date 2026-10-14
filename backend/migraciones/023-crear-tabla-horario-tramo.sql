CREATE TABLE horario_tramo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  -- NULL identifica el horario general; los días siguen getDay(): domingo = 0.
  temporada_id INT NULL,
  dia_semana TINYINT NOT NULL,
  abre TIME NOT NULL,
  cierra TIME NOT NULL,
  CONSTRAINT fk_horario_tramo_temporada FOREIGN KEY (temporada_id) REFERENCES temporada(id)
);
