import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Sparkles, Trophy, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { loadOrgTranslations } from "@/i18n/config";
import OrganizationHeader from "@/components/organization/OrganizationHeader";
import OrganizationFooter from "@/components/organization/OrganizationFooter";
import heroImage from "@/assets/hero-banner.jpg";

interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  font_family?: string;
  custom_content?: string;
  background_image_url?: string;
  status: string;
}

const OrganizationLanding = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrganization = async () => {
      if (!slug) return;

      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error || !data) {
        toast({
          title: "Organization not found",
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      if (data.status !== 'approved') {
        toast({
          title: "Organization not available",
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      setOrganization(data);

      // Load organization-specific translations
      await loadOrgTranslations(data.id, data.slug, i18n.language);

      setLoading(false);
    };

    loadOrganization();
  }, [slug, navigate, toast, i18n.language]);

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


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!organization) return null;

  return (
    <div className="min-h-screen" style={{ fontFamily: organization.font_family || 'inherit' }}>
      <OrganizationHeader organization={organization} showPopup={true} />

      <div className="pt-16">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{ backgroundImage: `url(${organization.background_image_url || heroImage})` }}
          />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              {organization.logo_url && (
                <img
                  src={organization.logo_url}
                  alt={organization.name}
                  className="h-24 w-auto mx-auto mb-6"
                />
              )}
              <h1
                className="text-5xl md:text-6xl font-bold mb-6"
                style={{
                  fontFamily: organization.font_family || 'inherit',
                  color: organization.primary_color || 'inherit'
                }}
              >
                {organization.id === '9d6a61e4-4323-4492-b7f1-b38a35ab5e7b' && i18n.language === 'es'
                  ? t('org.name', { ns: 'nest-egg', defaultValue: organization.name })
                  : organization.name}
              </h1>
              {organization.description && (
                <p className="text-xl text-muted-foreground mb-8">
                  {organization.id === '9d6a61e4-4323-4492-b7f1-b38a35ab5e7b' && i18n.language === 'es'
                    ? t('org.description', { ns: 'nest-egg', defaultValue: organization.description })
                    : organization.description}
                </p>
              )}
              {/* {organization.custom_content && (
                <div className="prose max-w-none mb-8 text-muted-foreground">
                  {organization.custom_content}
                </div>
              )} */}
              <Button
                size="lg"
                onClick={() => navigate(`/org/${slug}/play`)}
                className="text-lg px-8 py-6"
                style={{
                  backgroundColor: organization.primary_color,
                  color: 'white'
                }}
              >
                {t('playNow', { ns: 'organization' })}
              </Button>
            </div>
          </div>
        </section>

        {/* Game Overview Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2
                className="text-4xl md:text-5xl font-bold mb-4"
                style={{
                  fontFamily: organization.font_family || 'inherit',
                  color: organization.primary_color || 'inherit'
                }}
              >
                {t('howItWorks', { ns: 'organization' })}
              </h2>
              <p className="text-xl text-muted-foreground">
                {t('howItWorksDesc', { ns: 'organization' })}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              <Card className="text-center">
                <CardContent className="pt-6 space-y-3">
                  <div
                    className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${organization.primary_color || '#1EAEDB'}20` }}
                  >
                    <Users className="w-8 h-8" style={{ color: organization.primary_color }} />
                  </div>
                  <h3 className="font-bold text-xl">{t('players', { ns: 'organization' })}</h3>
                  <p className="text-muted-foreground text-sm">
                    {t('playersDesc', { ns: 'organization' })}
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="pt-6 space-y-3">
                  <div
                    className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${organization.secondary_color || '#33C3F0'}20` }}
                  >
                    <Sparkles className="w-8 h-8" style={{ color: organization.secondary_color }} />
                  </div>
                  <h3 className="font-bold text-xl">{t('funTopics', { ns: 'organization' })}</h3>
                  <p className="text-muted-foreground text-sm">
                    {t('funTopicsDesc', { ns: 'organization' })}
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="pt-6 space-y-3">
                  <div
                    className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${organization.primary_color || '#1EAEDB'}20` }}
                  >
                    <Trophy className="w-8 h-8" style={{ color: organization.primary_color }} />
                  </div>
                  <h3 className="font-bold text-xl">{t('scorePoints', { ns: 'organization' })}</h3>
                  <p className="text-muted-foreground text-sm">
                    {t('scorePointsDesc', { ns: 'organization' })}
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="pt-6 space-y-3">
                  <div
                    className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${organization.secondary_color || '#33C3F0'}20` }}
                  >
                    <Heart className="w-8 h-8" style={{ color: organization.secondary_color }} />
                  </div>
                  <h3 className="font-bold text-xl">{t('easySetup', { ns: 'organization' })}</h3>
                  <p className="text-muted-foreground text-sm">
                    {t('easySetupDesc', { ns: 'organization' })}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <h2
              className="text-4xl md:text-5xl font-bold mb-6"
              style={{
                fontFamily: organization.font_family || 'inherit',
                color: organization.primary_color || 'inherit'
              }}
            >
              {t('readyToPlay', { ns: 'organization' })}
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t('readyToPlayDesc', { ns: 'organization' })}
            </p>
            <Button
              size="lg"
              onClick={() => navigate(`/org/${slug}/play`)}
              className="text-lg px-8 py-6"
              style={{
                backgroundColor: organization.primary_color,
                color: 'white'
              }}
            >
              {t('getStarted', { ns: 'organization' })}
            </Button>
          </div>
        </section>

        <OrganizationFooter primaryColor={organization.primary_color} />
      </div>
    </div>
  );
};

export default OrganizationLanding;
