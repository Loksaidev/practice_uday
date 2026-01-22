-- Create storage bucket for topic item images
INSERT INTO storage.buckets (id, name, public)
VALUES ('topic-images', 'topic-images', true);

-- Allow org admins to upload images for their topics
CREATE POLICY "Org admins can upload topic images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'topic-images' AND
  EXISTS (
    SELECT 1
    FROM custom_topic_items cti
    JOIN custom_topics ct ON cti.custom_topic_id = ct.id
    JOIN organization_members om ON ct.organization_id = om.organization_id
    WHERE om.user_id = auth.uid()
      AND om.role = 'org_admin'::app_role
  )
);

-- Allow org admins to update images for their topics
CREATE POLICY "Org admins can update topic images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'topic-images' AND
  EXISTS (
    SELECT 1
    FROM custom_topic_items cti
    JOIN custom_topics ct ON cti.custom_topic_id = ct.id
    JOIN organization_members om ON ct.organization_id = om.organization_id
    WHERE om.user_id = auth.uid()
      AND om.role = 'org_admin'::app_role
  )
);

-- Allow org admins to delete images for their topics
CREATE POLICY "Org admins can delete topic images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'topic-images' AND
  EXISTS (
    SELECT 1
    FROM custom_topic_items cti
    JOIN custom_topics ct ON cti.custom_topic_id = ct.id
    JOIN organization_members om ON ct.organization_id = om.organization_id
    WHERE om.user_id = auth.uid()
      AND om.role = 'org_admin'::app_role
  )
);

-- Allow anyone to view public images
CREATE POLICY "Anyone can view topic images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'topic-images');