CREATE POLICY "Service role manages scene illustrations"
ON storage.objects FOR ALL
USING (bucket_id = 'scene-illustrations' AND auth.role() = 'service_role')
WITH CHECK (bucket_id = 'scene-illustrations' AND auth.role() = 'service_role');