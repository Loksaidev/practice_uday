-- Allow super admins to manage Knowsy topics
CREATE POLICY "Super admins can insert topics"
ON public.topics
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update topics"
ON public.topics
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can delete topics"
ON public.topics
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'));

-- Allow super admins to manage topic items
CREATE POLICY "Super admins can insert topic items"
ON public.topic_items
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update topic items"
ON public.topic_items
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can delete topic items"
ON public.topic_items
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'));