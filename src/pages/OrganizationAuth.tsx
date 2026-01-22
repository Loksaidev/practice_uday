import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { tOrg } from "@/utils/translation";
import OrganizationHeader from "@/components/organization/OrganizationHeader";
import OrganizationFooter from "@/components/organization/OrganizationFooter";
import { Eye, EyeOff } from "lucide-react";

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  font_family: string;
}

const OrganizationAuth = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { i18n } = useTranslation();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const fetchOrganization = async () => {
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .select("*")
        .eq("slug", slug)
        .eq("status", "approved")
        .single();

      if (orgError || !orgData) {
        navigate("/");
        return;
      }

      setOrganization(orgData);
      setLoading(false);
    };

    // Check if user is already logged in (only redirect if not anonymous)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && !session.user.is_anonymous) {
        navigate(`/org/${slug}/play`);
      }
    });

    fetchOrganization();
  }, [slug, navigate]);

  useEffect(() => {
    // Load custom Google Font if specified
    if (organization?.font_family && organization.font_family !== 'Roboto') {
      const fontName = organization.font_family.replace(/\s+/g, '+');
      const linkId = `google-font-${fontName}`;
      let link = document.getElementById(linkId) as HTMLLinkElement;

      if (!link) {
        link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@400;500;700&display=swap`;
        document.head.appendChild(link);
      }
    }

    // Set CSS variables
    if (organization?.primary_color) {
      document.documentElement.style.setProperty('--org-primary', organization.primary_color);
    }
    if (organization?.secondary_color) {
      document.documentElement.style.setProperty('--org-secondary', organization.secondary_color);
    }
    if (organization?.font_family) {
      document.documentElement.style.setProperty('--org-font', organization.font_family);
    }
  }, [organization]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: tOrg('org.welcomeBackToast', 'Welcome back!', organization.id, organization.slug),
          description: tOrg('org.loginSuccess', 'You have successfully logged in.', organization.id, organization.slug),
        });
        navigate(`/org/${slug}/play`);
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
            emailRedirectTo: `${window.location.origin}/org/${slug}/play`,
          },
        });

        if (error) throw error;

        toast({
          title: tOrg('org.accountCreated', 'Account created!', organization.id, organization.slug),
          description: tOrg('org.checkEmail', 'Please check your email to verify your account.', organization.id, organization.slug),
        });
      }
    } catch (error: any) {
      toast({
        title: tOrg('org.error', 'Error', organization.id, organization.slug),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !organization) {
    return <div className="flex items-center justify-center min-h-screen">{i18n.t('org.loading', { ns: 'nest-egg', defaultValue: 'Loading...' })}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: organization.font_family }}>
      <OrganizationHeader organization={organization} />

      <main className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center mt-16">
        <Card className="w-full max-w-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ color: organization.primary_color }}>
              {isLogin ? tOrg('org.welcomeBack', 'Welcome Back', organization.id, organization.slug) : tOrg('org.createAccount', 'Create Account', organization.id, organization.slug)}
            </h1>
            <p className="text-muted-foreground">
              {isLogin ? tOrg('org.signInToAccount', 'Sign in to your account', organization.id, organization.slug) : tOrg('org.signUpToGetStarted', 'Sign up to get started', organization.id, organization.slug)}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">{tOrg('org.fullName', 'Full Name', organization.id, organization.slug)}</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={tOrg('org.enterFullName', 'Enter your full name', organization.id, organization.slug)}
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">{tOrg('org.email', 'Email', organization.id, organization.slug)}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={tOrg('org.enterEmail', 'Enter your email', organization.id, organization.slug)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{tOrg('org.password', 'Password', organization.id, organization.slug)}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={tOrg('org.enterPassword', 'Enter your password', organization.id, organization.slug)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  disabled={submitting}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full text-white"
              style={{ backgroundColor: organization.primary_color }}
              disabled={submitting}
            >
              {submitting ? tOrg('org.pleaseWait', 'Please wait...', organization.id, organization.slug) : isLogin ? tOrg('org.signIn', 'Sign In', organization.id, organization.slug) : tOrg('org.signUp', 'Sign Up', organization.id, organization.slug)}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:underline"
            >
              {isLogin
                ? tOrg('org.dontHaveAccount', "Don't have an account? Sign up", organization.id, organization.slug)
                : tOrg('org.alreadyHaveAccount', "Already have an account? Sign in", organization.id, organization.slug)}
            </button>
          </div>
        </Card>
      </main>

      <OrganizationFooter primaryColor={organization.primary_color} />
    </div>
  );
};

export default OrganizationAuth;
