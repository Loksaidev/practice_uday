-- Add image_url column to topic_items table
ALTER TABLE public.topic_items
ADD COLUMN IF NOT EXISTS image_url text;

-- Create storage policies for topic-images bucket if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Super admins can upload topic images'
  ) THEN
    CREATE POLICY "Super admins can upload topic images"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'topic-images' AND
      has_role(auth.uid(), 'super_admin'::app_role)
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Super admins can update topic images'
  ) THEN
    CREATE POLICY "Super admins can update topic images"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'topic-images' AND
      has_role(auth.uid(), 'super_admin'::app_role)
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Super admins can delete topic images'
  ) THEN
    CREATE POLICY "Super admins can delete topic images"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'topic-images' AND
      has_role(auth.uid(), 'super_admin'::app_role)
    );
  END IF;
END $$;