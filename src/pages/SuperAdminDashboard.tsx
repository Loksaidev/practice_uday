import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, Building2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TopicsManagement from "@/components/admin/TopicsManagement";
import StoreManagement from "@/components/admin/StoreManagement";

interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  created_at: string;
  created_by: string;
  profiles: {
    email: string;
    full_name: string | null;
  };
}

const SuperAdminDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkSuperAdminAccess();
  }, []);

  const checkSuperAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth?redirect=/super-admin");
        return;
      }

      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "super_admin")
        .single();

      if (error || !roles) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You don't have super admin privileges.",
        });
        navigate("/");
        return;
      }

      setIsSuperAdmin(true);
      await loadOrganizations();
    } catch (error) {
      console.error("Error checking access:", error);
      navigate("/");
    } finally {
      setIsLoading(false);
    }
  };

  const loadOrganizations = async () => {
    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load organizations.",
      });
      return;
    }

    // Fetch profile data separately for each organization
    const orgsWithProfiles = await Promise.all(
      (data || []).map(async (org) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", org.created_by)
          .single();
        
        return {
          ...org,
          profiles: profile || { email: "Unknown", full_name: null },
        };
      })
    );

    setOrganizations(orgsWithProfiles);
  };

  const updateOrganizationStatus = async (orgId: string, status: "approved" | "rejected") => {
    setProcessingId(orgId);
    
    try {
      const { error } = await supabase
        .from("organizations")
        .update({ status })
        .eq("id", orgId);

      if (error) throw error;

      // If approved, make the creator an org_admin
      if (status === "approved") {
        const org = organizations.find(o => o.id === orgId);
        if (org) {
          await supabase.from("organization_members").insert({
            organization_id: orgId,
            user_id: org.created_by,
            role: "org_admin",
          });
        }
      }

      toast({
        title: "Success",
        description: `Organization ${status} successfully.`,
      });

      await loadOrganizations();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || `Failed to ${status} organization.`,
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-20 pt-24">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h1 className="text-4xl font-heading mb-2">Super Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage organizations, topics, and platform settings</p>
          </div>

          <Tabs defaultValue="organizations" className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-2xl">
              <TabsTrigger value="organizations">Organizations</TabsTrigger>
              <TabsTrigger value="topics">Topics</TabsTrigger>
              <TabsTrigger value="store">Store</TabsTrigger>
            </TabsList>

            <TabsContent value="organizations" className="space-y-6 mt-6">
              <div className="grid gap-6">
            {organizations.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No organization applications yet.</p>
                </CardContent>
              </Card>
            ) : (
              organizations.map((org) => (
                <Card key={org.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-2xl font-heading">{org.name}</CardTitle>
                        <CardDescription>Slug: /{org.slug}</CardDescription>
                      </div>
                      <Badge
                        variant={
                          org.status === "approved"
                            ? "default"
                            : org.status === "rejected"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {org.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Description</p>
                      <p>{org.description || "No description provided"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Created by</p>
                      <p>
                        {org.profiles?.full_name || "Unknown"} ({org.profiles?.email})
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Created at</p>
                      <p>{new Date(org.created_at).toLocaleString()}</p>
                    </div>

                    {org.status === "pending" && (
                      <div className="flex gap-3 pt-4">
                        <Button
                          onClick={() => updateOrganizationStatus(org.id, "approved")}
                          disabled={processingId === org.id}
                          className="flex-1"
                        >
                          {processingId === org.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="mr-2 h-4 w-4" />
                          )}
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => updateOrganizationStatus(org.id, "rejected")}
                          disabled={processingId === org.id}
                          className="flex-1"
                        >
                          {processingId === org.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="mr-2 h-4 w-4" />
                          )}
                          Reject
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
              </div>
            </TabsContent>

            <TabsContent value="topics" className="mt-6">
              <TopicsManagement />
            </TabsContent>

            <TabsContent value="store" className="mt-6">
              <StoreManagement />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SuperAdminDashboard;
