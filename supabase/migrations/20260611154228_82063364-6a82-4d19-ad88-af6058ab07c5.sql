DROP POLICY IF EXISTS "Authenticated users can insert inventory sync logs" ON public.inventory_sync_logs;

CREATE POLICY "Authenticated users can insert inventory sync logs"
  ON public.inventory_sync_logs
  FOR INSERT
  TO public
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');