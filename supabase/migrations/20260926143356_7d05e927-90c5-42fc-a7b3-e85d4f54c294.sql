CREATE TABLE public.detector_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL CHECK (char_length(device_id) BETWEEN 1 AND 64),
  temperature DOUBLE PRECISION NOT NULL CHECK (temperature BETWEEN -50 AND 100),
  humidity DOUBLE PRECISION NOT NULL CHECK (humidity BETWEEN 0 AND 100),
  pressure DOUBLE PRECISION NOT NULL CHECK (pressure BETWEEN 300 AND 1200),
  voc DOUBLE PRECISION NOT NULL CHECK (voc BETWEEN 0 AND 1000000),
  measured_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.detector_readings TO service_role;

ALTER TABLE public.detector_readings ENABLE ROW LEVEL SECURITY;

CREATE INDEX detector_readings_device_created_idx
  ON public.detector_readings (device_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.update_detector_readings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_detector_readings_updated_at
BEFORE UPDATE ON public.detector_readings
FOR EACH ROW
EXECUTE FUNCTION public.update_detector_readings_updated_at();