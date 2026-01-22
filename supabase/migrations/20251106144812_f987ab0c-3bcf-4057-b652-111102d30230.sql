-- Add RLS policy to allow anyone to upload game custom item images
CREATE POLICY "Anyone can upload game custom items"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'topic-images' AND (storage.foldername(name))[1] = 'game-custom-items');

-- Add RLS policy to allow anyone to read game custom item images
CREATE POLICY "Anyone can view game custom items"
ON storage.objects
FOR SELECT
USING (bucket_id = 'topic-images' AND (storage.foldername(name))[1] = 'game-custom-items');