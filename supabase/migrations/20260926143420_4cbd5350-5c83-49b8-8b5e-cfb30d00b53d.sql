CREATE POLICY "Trusted server manages detector readings"
ON public.detector_readings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);