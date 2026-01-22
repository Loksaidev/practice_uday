-- Create organization store items table
CREATE TABLE public.org_store_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC NOT NULL,
  image_url TEXT NOT NULL,
  category TEXT NOT NULL,
  rating NUMERIC DEFAULT 4.5,
  stock INTEGER DEFAULT 100,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.org_store_items ENABLE ROW LEVEL SECURITY;

-- Anyone can view org store items for approved orgs
CREATE POLICY "Anyone can view org store items"
ON public.org_store_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organizations
    WHERE organizations.id = org_store_items.organization_id
    AND organizations.status = 'approved'
  )
);

-- Org admins can manage their store items
CREATE POLICY "Org admins can manage their store items"
ON public.org_store_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_members.organization_id = org_store_items.organization_id
    AND organization_members.user_id = auth.uid()
    AND organization_members.role = 'org_admin'::app_role
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_org_store_items_updated_at
BEFORE UPDATE ON public.org_store_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();