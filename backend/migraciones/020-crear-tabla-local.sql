-- Solo hay un salón: la fila con id 1 guarda su configuración común.
CREATE TABLE local (
  id TINYINT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  zona_horaria VARCHAR(64) NOT NULL
);
