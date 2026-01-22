-- Create storage bucket for store item images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('store-images', 'store-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for store item images
CREATE POLICY "Anyone can view store images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'store-images');

CREATE POLICY "Super admins can upload store images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'store-images' 
  AND has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Super admins can update store images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'store-images' 
  AND has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Super admins can delete store images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'store-images' 
  AND has_role(auth.uid(), 'super_admin'::app_role)
);