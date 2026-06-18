
-- ticket-images: open read + open upload (used by anonymous ticket creators)
CREATE POLICY "ticket-images public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'ticket-images');
CREATE POLICY "ticket-images public insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'ticket-images');
CREATE POLICY "ticket-images admin update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'ticket-images');
CREATE POLICY "ticket-images admin delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'ticket-images');

-- avatars: public read; admin manages own folder (path = "{user_id}/...")
CREATE POLICY "avatars public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars owner insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
  );
CREATE POLICY "avatars owner update" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
  );
CREATE POLICY "avatars owner delete" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
  );
