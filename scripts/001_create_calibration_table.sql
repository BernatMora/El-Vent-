-- Taula per guardar les dades de calibratge
-- Compara les previsions d'Open-Meteo amb les dades reals del Camping Aquarius

CREATE TABLE IF NOT EXISTS wind_calibration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Data i hora de la mesura real
  measurement_time TIMESTAMPTZ NOT NULL,
  
  -- Dades reals del Camping Aquarius (en nusos)
  real_wind_speed DECIMAL(5,2) NOT NULL,
  real_wind_gust DECIMAL(5,2) NOT NULL,
  real_wind_direction INTEGER, -- graus (0-360)
  
  -- Dades previstes per Open-Meteo (en nusos)
  predicted_wind_speed DECIMAL(5,2),
  predicted_wind_gust DECIMAL(5,2),
  predicted_wind_direction INTEGER,
  
  -- Factors de correcció calculats
  wind_speed_factor DECIMAL(5,3) GENERATED ALWAYS AS (
    CASE WHEN predicted_wind_speed > 0 
    THEN real_wind_speed / predicted_wind_speed 
    ELSE 1 END
  ) STORED,
  
  wind_gust_factor DECIMAL(5,3) GENERATED ALWAYS AS (
    CASE WHEN predicted_wind_gust > 0 
    THEN real_wind_gust / predicted_wind_gust 
    ELSE 1 END
  ) STORED,
  
  -- Metadata
  notes TEXT,
  source TEXT DEFAULT 'Camping Aquarius'
);

-- Index per cerques per data
CREATE INDEX IF NOT EXISTS idx_calibration_time ON wind_calibration(measurement_time);

-- Index per cerques per direcció del vent (per calibratge per direcció)
CREATE INDEX IF NOT EXISTS idx_calibration_direction ON wind_calibration(real_wind_direction);

-- Taula per guardar els factors de correcció calculats
CREATE TABLE IF NOT EXISTS calibration_factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Rang de direcció del vent (per exemple, Tramuntana = 315-45 graus)
  wind_direction_min INTEGER NOT NULL,
  wind_direction_max INTEGER NOT NULL,
  direction_name TEXT, -- Tramuntana, Garbí, Llevant, etc.
  
  -- Factors de correcció mitjans
  avg_wind_speed_factor DECIMAL(5,3) DEFAULT 1.0,
  avg_wind_gust_factor DECIMAL(5,3) DEFAULT 1.0,
  
  -- Estadístiques
  sample_count INTEGER DEFAULT 0,
  confidence DECIMAL(3,2) DEFAULT 0.5, -- 0-1, basat en nombre de mostres
  
  UNIQUE(wind_direction_min, wind_direction_max)
);

-- Inserir factors inicials per cada direcció del vent
INSERT INTO calibration_factors (wind_direction_min, wind_direction_max, direction_name) VALUES
  (337, 22, 'Tramuntana'),      -- N
  (23, 67, 'Gregal'),           -- NE
  (68, 112, 'Llevant'),         -- E
  (113, 157, 'Xaloc'),          -- SE
  (158, 202, 'Migjorn'),        -- S
  (203, 247, 'Garbí/Llebeig'),  -- SW
  (248, 292, 'Ponent'),         -- W
  (293, 336, 'Mestral')         -- NW
ON CONFLICT DO NOTHING;

-- Funció per actualitzar els factors de calibratge
CREATE OR REPLACE FUNCTION update_calibration_factors()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualitzar els factors per la direcció del vent corresponent
  UPDATE calibration_factors cf
  SET 
    avg_wind_speed_factor = (
      SELECT AVG(wind_speed_factor) 
      FROM wind_calibration wc 
      WHERE wc.real_wind_direction BETWEEN cf.wind_direction_min AND cf.wind_direction_max
        OR (cf.wind_direction_min > cf.wind_direction_max AND 
            (wc.real_wind_direction >= cf.wind_direction_min OR wc.real_wind_direction <= cf.wind_direction_max))
    ),
    avg_wind_gust_factor = (
      SELECT AVG(wind_gust_factor) 
      FROM wind_calibration wc 
      WHERE wc.real_wind_direction BETWEEN cf.wind_direction_min AND cf.wind_direction_max
        OR (cf.wind_direction_min > cf.wind_direction_max AND 
            (wc.real_wind_direction >= cf.wind_direction_min OR wc.real_wind_direction <= cf.wind_direction_max))
    ),
    sample_count = (
      SELECT COUNT(*) 
      FROM wind_calibration wc 
      WHERE wc.real_wind_direction BETWEEN cf.wind_direction_min AND cf.wind_direction_max
        OR (cf.wind_direction_min > cf.wind_direction_max AND 
            (wc.real_wind_direction >= cf.wind_direction_min OR wc.real_wind_direction <= cf.wind_direction_max))
    ),
    confidence = LEAST(1.0, (
      SELECT COUNT(*)::decimal / 20 
      FROM wind_calibration wc 
      WHERE wc.real_wind_direction BETWEEN cf.wind_direction_min AND cf.wind_direction_max
        OR (cf.wind_direction_min > cf.wind_direction_max AND 
            (wc.real_wind_direction >= cf.wind_direction_min OR wc.real_wind_direction <= cf.wind_direction_max))
    )),
    updated_at = NOW()
  WHERE NEW.real_wind_direction BETWEEN cf.wind_direction_min AND cf.wind_direction_max
    OR (cf.wind_direction_min > cf.wind_direction_max AND 
        (NEW.real_wind_direction >= cf.wind_direction_min OR NEW.real_wind_direction <= cf.wind_direction_max));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger per actualitzar factors quan s'afegeix una nova mesura
DROP TRIGGER IF EXISTS trigger_update_calibration ON wind_calibration;
CREATE TRIGGER trigger_update_calibration
  AFTER INSERT ON wind_calibration
  FOR EACH ROW
  EXECUTE FUNCTION update_calibration_factors();
