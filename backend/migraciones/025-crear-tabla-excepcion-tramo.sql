CREATE TABLE excepcion_tramo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  excepcion_id INT NOT NULL,
  abre TIME NOT NULL,
  cierra TIME NOT NULL,
  CONSTRAINT fk_excepcion_tramo_excepcion FOREIGN KEY (excepcion_id)
    REFERENCES excepcion_horario(id) ON DELETE CASCADE
);
