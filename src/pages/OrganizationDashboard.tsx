import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import OrganizationOverview from "@/components/dashboard/OrganizationOverview";
import OrganizationBranding from "@/components/dashboard/OrganizationBranding";
import OrganizationTopics from "@/components/dashboard/OrganizationTopics";
import OrganizationStoreManagement from "@/components/dashboard/OrganizationStoreManagement";
import OrganizationAnalytics from "@/components/dashboard/OrganizationAnalytics";

interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  background_image_url: string | null;
  primary_color: string;
  secondary_color: string;
  font_family: string;
  require_login: boolean;
  status: string;
  custom_content: string | null;
  use_knowsy_topics: boolean;
  enable_popup: boolean;
  popup_description: string | null;
}

const OrganizationDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth?redirect=/dashboard");
        return;
      }

      // Check if user is an org_admin
      const { data: membership, error: memberError } = await supabase
        .from("organization_members")
        .select("organization_id, role")
        .eq("user_id", session.user.id)
        .eq("role", "org_admin")
        .single();

      if (memberError || !membership) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You don't have organization admin privileges.",
        });
        navigate("/");
        return;
      }

      // Load organization details
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", membership.organization_id)
        .single();

      if (orgError || !org) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load organization details.",
        });
        navigate("/");
        return;
      }

      // Check if organization is approved
      if (org.status !== "approved") {
        toast({
          title: "Application Pending",
          description: org.status === "pending" 
            ? "Your organization application is still under review."
            : "Your organization application needs approval to access the dashboard.",
        });
        navigate("/");
        return;
      }

      setOrganization(org);
    } catch (error) {
      console.error("Error checking access:", error);
      navigate("/");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshOrganization = async () => {
    if (!organization) return;
    
    const { data: org } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", organization.id)
      .single();

    if (org) {
      setOrganization(org);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!organization) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-20 pt-24">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center gap-6">
            {organization.logo_url && (
              <img 
                src={organization.logo_url} 
                alt={`${organization.name} logo`}
                className="w-20 h-20 object-contain rounded-lg"
              />
            )}
            <div>
              <h1 className="text-4xl font-heading mb-2">
                {organization.name}
              </h1>
              <p className="text-muted-foreground">Manage your organization settings and content</p>
            </div>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="topics">Topics</TabsTrigger>
              <TabsTrigger value="store">Store</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-6">
              <OrganizationOverview organization={organization} />
            </TabsContent>
            
            <TabsContent value="branding" className="mt-6">
              <OrganizationBranding 
                organization={organization} 
                onUpdate={refreshOrganization}
              />
            </TabsContent>
            
            <TabsContent value="topics" className="mt-6">
              <OrganizationTopics organizationId={organization.id} />
            </TabsContent>
            
            <TabsContent value="store" className="mt-6">
              <OrganizationStoreManagement organizationId={organization.id} />
            </TabsContent>
            
            <TabsContent value="analytics" className="mt-6">
              <OrganizationAnalytics organizationId={organization.id} />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OrganizationDashboard;
