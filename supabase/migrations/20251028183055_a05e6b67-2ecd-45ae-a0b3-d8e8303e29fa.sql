-- Create storage bucket for organization logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('org-logos', 'org-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow org admins to upload logos
CREATE POLICY "Org admins can upload their logo"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'org-logos' AND
  EXISTS (
    SELECT 1
    FROM organization_members
    WHERE user_id = auth.uid()
      AND role = 'org_admin'::app_role
      AND organization_id::text = (storage.foldername(name))[1]
  )
);

-- Allow org admins to update logos
CREATE POLICY "Org admins can update their logo"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'org-logos' AND
  EXISTS (
    SELECT 1
    FROM organization_members
    WHERE user_id = auth.uid()
      AND role = 'org_admin'::app_role
      AND organization_id::text = (storage.foldername(name))[1]
  )
);

-- Allow org admins to delete logos
CREATE POLICY "Org admins can delete their logo"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'org-logos' AND
  EXISTS (
    SELECT 1
    FROM organization_members
    WHERE user_id = auth.uid()
      AND role = 'org_admin'::app_role
      AND organization_id::text = (storage.foldername(name))[1]
  )
);

-- Allow anyone to view logos
CREATE POLICY "Anyone can view org logos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'org-logos');

-- Add custom content field to organizations
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS custom_content TEXT;