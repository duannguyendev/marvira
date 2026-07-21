-- PostGIS is optional; API falls back to haversine when the extension is unavailable.
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS postgis;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'PostGIS extension not available — using haversine fallback';
END
$$;

-- Spatial index for nearby place queries (only when PostGIS is installed).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
    CREATE INDEX IF NOT EXISTS places_geo_idx
      ON places USING GIST (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326));
  END IF;
END
$$;
