
-- 1. Tighten storage.objects policies on the public buckets.
DROP POLICY IF EXISTS "Authenticated users can upload sound effects" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update sound effects" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload NPC portraits" ON storage.objects;
DROP POLICY IF EXISTS "Public can read sound effects" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view NPC portraits" ON storage.objects;

-- Writes happen exclusively from edge functions with the service role.
CREATE POLICY "Service role can manage sound effects"
  ON storage.objects FOR ALL
  TO public
  USING (bucket_id = 'sound-effects' AND auth.role() = 'service_role')
  WITH CHECK (bucket_id = 'sound-effects' AND auth.role() = 'service_role');

CREATE POLICY "Service role can manage NPC portraits"
  ON storage.objects FOR ALL
  TO public
  USING (bucket_id = 'npc-portraits' AND auth.role() = 'service_role')
  WITH CHECK (bucket_id = 'npc-portraits' AND auth.role() = 'service_role');

-- 2. Trigger-only SECURITY DEFINER helpers must not be directly callable.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
