import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const OrganizationApplication = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth?redirect=/apply");
      return;
    }

    // Check if user already has an application
    const { data: existingApp } = await supabase
      .from("organizations")
      .select("id, status, name, created_at")
      .eq("created_by", session.user.id)
      .order("created_at", { ascending: false })
      .maybeSingle();

    if (existingApp) {
      if (existingApp.status === "pending") {
        toast({
          title: t('organizationApplication.applicationPending'),
          description: t('organizationApplication.pendingDescription'),
        });
        navigate("/");
        return;
      } else if (existingApp.status === "approved") {
        toast({
          title: t('organizationApplication.alreadyApproved'),
          description: t('organizationApplication.approvedDescription'),
        });
        navigate("/dashboard");
        return;
      }
      // If rejected, allow them to reapply (continue with form)
    }
    
    setIsAuthenticated(true);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleNameChange = (value: string) => {
    setName(value);
    setSlug(generateSlug(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      // Check if slug is already taken
      const { data: existing } = await supabase
        .from("organizations")
        .select("id")
        .eq("slug", slug)
        .single();

      if (existing) {
        toast({
          variant: "destructive",
          title: t('organizationApplication.error'),
          description: t('organizationApplication.slugTaken'),
        });
        setIsLoading(false);
        return;
      }

      const { error } = await supabase.from("organizations").insert({
        name,
        slug,
        description,
        created_by: session.user.id,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: t('organizationApplication.applicationSubmitted'),
        description: t('organizationApplication.submittedDescription'),
      });

      navigate("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t('organizationApplication.error'),
        description: error.message || t('organizationApplication.submitFailed'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center px-4 py-20 pt-24">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-heading">{t('organizationApplication.title')}</CardTitle>
            <CardDescription>
              {t('organizationApplication.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">{t('organizationApplication.organizationName')}</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder={t('organizationApplication.organizationNamePlaceholder')}
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">{t('organizationApplication.urlSlug')}</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">knowsy.com/org/</span>
                  <Input
                    id="slug"
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    required
                    disabled={isLoading}
                    pattern="[a-z0-9-]+"
                    title={t('organizationApplication.slugPattern')}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('organizationApplication.slugDescription')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('organizationApplication.description')}</Label>
                <Textarea
                  id="description"
                  placeholder={t('organizationApplication.descriptionPlaceholder')}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isLoading}
                  rows={4}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('organizationApplication.submitApplication')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default OrganizationApplication;
