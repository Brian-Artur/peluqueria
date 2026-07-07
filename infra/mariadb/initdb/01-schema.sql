-- Esquema v1: agenda básica (cliente, servicio, cita)

CREATE TABLE cliente (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  nombre   VARCHAR(120) NOT NULL,
  telefono VARCHAR(20)
);

CREATE TABLE servicio (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  nombre       VARCHAR(120) NOT NULL,
  duracion_min INT NOT NULL,
  precio       DECIMAL(7,2) NOT NULL
);

CREATE TABLE cita (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id  INT NOT NULL,
  servicio_id INT NOT NULL,
  inicio      DATETIME NOT NULL,
  fin         DATETIME NOT NULL,
  estado      ENUM('reservada','cancelada','completada') NOT NULL DEFAULT 'reservada',
  FOREIGN KEY (cliente_id)  REFERENCES cliente(id),
  FOREIGN KEY (servicio_id) REFERENCES servicio(id)
);
