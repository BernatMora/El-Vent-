-- Afegir columna direction_category a la taula wind_calibration
ALTER TABLE wind_calibration 
ADD COLUMN IF NOT EXISTS direction_category TEXT;

-- Actualitzar registres existents amb la categoria basada en la direcció
UPDATE wind_calibration 
SET direction_category = CASE
  WHEN real_wind_direction >= 0 AND real_wind_direction < 45 THEN 'N'
  WHEN real_wind_direction >= 45 AND real_wind_direction < 90 THEN 'NE'
  WHEN real_wind_direction >= 90 AND real_wind_direction < 135 THEN 'E'
  WHEN real_wind_direction >= 135 AND real_wind_direction < 180 THEN 'SE'
  WHEN real_wind_direction >= 180 AND real_wind_direction < 225 THEN 'S'
  WHEN real_wind_direction >= 225 AND real_wind_direction < 270 THEN 'SW'
  WHEN real_wind_direction >= 270 AND real_wind_direction < 315 THEN 'W'
  ELSE 'NW'
END
WHERE direction_category IS NULL;
