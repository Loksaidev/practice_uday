-- Drop the problematic policy
DROP POLICY IF EXISTS "Org admins can view their org members" ON public.organization_members;

-- Create a security definer function to check if user is org admin
CREATE OR REPLACE FUNCTION public.is_org_admin(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND organization_id = _org_id
      AND role = 'org_admin'::app_role
  )
$$;

-- Recreate the policy using the security definer function
CREATE POLICY "Org admins can view their org members"
ON public.organization_members
FOR SELECT
USING (public.is_org_admin(auth.uid(), organization_id));