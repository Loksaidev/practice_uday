-- Create app_role enum for role types
CREATE TYPE public.app_role AS ENUM ('super_admin', 'org_admin', 'player');

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table (separate table to avoid privilege escalation)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create organizations table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#1EAEDB',
  secondary_color TEXT DEFAULT '#33C3F0',
  font_family TEXT DEFAULT 'Roboto',
  require_login BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Create organization_members table (links users to organizations)
CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role DEFAULT 'player' NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(organization_id, user_id)
);

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Add organization_id to game_rooms
ALTER TABLE public.game_rooms ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

-- Add user_id to players table (nullable for non-authenticated players)
ALTER TABLE public.players ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.players ADD COLUMN organization_id UUID REFERENCES public.organizations(id);

-- Create custom_topics table for organization-specific topics
CREATE TABLE public.custom_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.custom_topics ENABLE ROW LEVEL SECURITY;

-- Create custom_topic_items table
CREATE TABLE public.custom_topic_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_topic_id UUID REFERENCES public.custom_topics(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.custom_topic_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Super admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Super admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'));

-- RLS Policies for organizations
CREATE POLICY "Anyone can view approved organizations"
  ON public.organizations FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Super admins can view all organizations"
  ON public.organizations FOR SELECT
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Authenticated users can create organizations"
  ON public.organizations FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Super admins can update organizations"
  ON public.organizations FOR UPDATE
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Org admins can update their organization"
  ON public.organizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = organizations.id
        AND user_id = auth.uid()
        AND role = 'org_admin'
    )
  );

-- RLS Policies for organization_members
CREATE POLICY "Members can view their organization memberships"
  ON public.organization_members FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Org admins can view their org members"
  ON public.organization_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'org_admin'
    )
  );

CREATE POLICY "Super admins can manage all members"
  ON public.organization_members FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'));

-- RLS Policies for custom_topics
CREATE POLICY "Anyone can view custom topics for approved orgs"
  ON public.custom_topics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = custom_topics.organization_id
        AND status = 'approved'
    )
  );

CREATE POLICY "Org admins can manage their topics"
  ON public.custom_topics FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_id = custom_topics.organization_id
        AND user_id = auth.uid()
        AND role = 'org_admin'
    )
  );

-- RLS Policies for custom_topic_items
CREATE POLICY "Anyone can view custom topic items"
  ON public.custom_topic_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.custom_topics ct
      JOIN public.organizations o ON ct.organization_id = o.id
      WHERE ct.id = custom_topic_items.custom_topic_id
        AND o.status = 'approved'
    )
  );

CREATE POLICY "Org admins can manage their topic items"
  ON public.custom_topic_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.custom_topics ct
      JOIN public.organization_members om ON ct.organization_id = om.organization_id
      WHERE ct.id = custom_topic_items.custom_topic_id
        AND om.user_id = auth.uid()
        AND om.role = 'org_admin'
    )
  );

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger for updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on organizations
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- NOTE: To create the first super admin:
-- 1. Sign up a user account
-- 2. Get the user's UUID from auth.users
-- 3. Run: INSERT INTO public.user_roles (user_id, role) VALUES ('YOUR_USER_UUID', 'super_admin');
-- Or uncomment and modify this line with your email after first signup:
-- INSERT INTO public.user_roles (user_id, role) 
-- SELECT id, 'super_admin' FROM auth.users WHERE email = 'admin@knowsy.com' LIMIT 1;