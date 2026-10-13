-- id es el SHA-256 del token de la cookie, no el token: si se filtra la BD,
-- no sirve para suplantar a nadie.
CREATE TABLE sesion (
  id CHAR(64) PRIMARY KEY,
  usuario_id INT NOT NULL,
  creada_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expira_en DATETIME NOT NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE
);
