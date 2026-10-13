-- Los datos antiguos usaban espacios y omitían el prefijo español; la API ahora guarda E.164.
UPDATE cliente
SET telefono = CASE
  WHEN telefono IS NULL OR REPLACE(telefono, ' ', '') = '' THEN NULL
  WHEN REPLACE(telefono, ' ', '') LIKE '+%' THEN REPLACE(telefono, ' ', '')
  ELSE CONCAT('+34', REPLACE(telefono, ' ', ''))
END;
