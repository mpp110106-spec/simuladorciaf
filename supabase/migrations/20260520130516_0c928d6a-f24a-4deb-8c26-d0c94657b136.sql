CREATE POLICY "turno_diario_counters_no_direct_access"
ON public.turno_diario_counters
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);