-- Conserva la agenda actual hasta que el encargado configure el horario real.
-- Una BD sembrada que ya tenga horario general conserva todos sus tramos.
INSERT INTO horario_tramo (temporada_id, dia_semana, abre, cierra)
SELECT NULL, dias.dia_semana, '09:00:00', '20:00:00'
FROM (
  SELECT 2 AS dia_semana UNION ALL SELECT 3 UNION ALL SELECT 4
  UNION ALL SELECT 5 UNION ALL SELECT 6
) AS dias
WHERE NOT EXISTS (SELECT 1 FROM horario_tramo WHERE temporada_id IS NULL);
