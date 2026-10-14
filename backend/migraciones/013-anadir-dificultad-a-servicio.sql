ALTER TABLE servicio ADD COLUMN dificultad ENUM('baja', 'media', 'alta') NOT NULL DEFAULT 'media';
