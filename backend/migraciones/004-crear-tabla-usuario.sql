CREATE TABLE usuario (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre_usuario VARCHAR(50) NOT NULL UNIQUE,
  nombre VARCHAR(120) NOT NULL,
  hash_contrasena VARCHAR(255) NOT NULL,
  rol ENUM('admin', 'encargado', 'recepcion', 'empleado') NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
