-- Add RLS policies for organization admins to upload store item images
-- Allow org admins to upload store images for their organization
CREATE POLICY "Org admins can upload store images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'store-images' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text 
    FROM organizations 
    WHERE id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
      AND role = 'org_admin'::app_role
    )
  )
);

-- Allow org admins to update their organization's store images
CREATE POLICY "Org admins can update their store images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'store-images' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text 
    FROM organizations 
    WHERE id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
      AND role = 'org_admin'::app_role
    )
  )
);

-- Allow org admins to delete their organization's store images
CREATE POLICY "Org admins can delete their store images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'store-images' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text 
    FROM organizations 
    WHERE id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
      AND role = 'org_admin'::app_role
    )
  )
);