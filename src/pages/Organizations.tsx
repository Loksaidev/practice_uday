import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Users, TrendingUp, Heart, Shield, Zap } from "lucide-react";

const Organizations = () => {
  const { t } = useTranslation();

  const benefits = [
    {
      icon: Users,
      title: t('organizations.benefits.teamBuilding.title'),
      description: t('organizations.benefits.teamBuilding.description')
    },
    {
      icon: TrendingUp,
      title: t('organizations.benefits.boostEngagement.title'),
      description: t('organizations.benefits.boostEngagement.description')
    },
    {
      icon: Heart,
      title: t('organizations.benefits.buildCulture.title'),
      description: t('organizations.benefits.buildCulture.description')
    },
    {
      icon: Shield,
      title: t('organizations.benefits.safeInclusive.title'),
      description: t('organizations.benefits.safeInclusive.description')
    },
    {
      icon: Zap,
      title: t('organizations.benefits.quickSetup.title'),
      description: t('organizations.benefits.quickSetup.description')
    },
    {
      icon: Building2,
      title: t('organizations.benefits.customBranding.title'),
      description: t('organizations.benefits.customBranding.description')
    }
  ];

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--knowsy-blue))]/10 via-background to-[hsl(var(--knowsy-purple))]/10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            <div className="inline-block mb-4">
              <span className="bg-gradient-to-r from-[hsl(var(--knowsy-yellow))] to-[hsl(var(--knowsy-red))] text-foreground px-6 py-2 rounded-full font-heading text-sm">
                {t('organizations.hero.badge')}
              </span>
            </div>
            <h1 className="font-heading text-5xl md:text-6xl">
              <span className="bg-gradient-to-r from-[hsl(var(--knowsy-blue))] via-[hsl(var(--knowsy-purple))] to-[hsl(var(--knowsy-red))] bg-clip-text text-transparent">
                {t('organizations.hero.title')}
              </span>
            </h1>
            <p className="text-xl text-muted-foreground font-body">
              {t('organizations.hero.description')}
            </p>
            <div className="flex flex-wrap gap-4 justify-center pt-6">
              <Link to="/apply">
                <Button variant="hero" size="lg">
                  {t('organizations.hero.applyNow')}
                </Button>
              </Link>
              <Link to="/contact-sales">
                <Button variant="outline" size="lg">
                  {t('organizations.hero.contactSales')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-heading text-4xl md:text-5xl mb-4">
              <span className="bg-gradient-to-r from-[hsl(var(--knowsy-blue))] to-[hsl(var(--knowsy-purple))] bg-clip-text text-transparent">
                {t('organizations.benefits.title')}
              </span>
            </h2>
            <p className="text-xl text-muted-foreground font-body max-w-2xl mx-auto">
              {t('organizations.benefits.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[hsl(var(--knowsy-blue))] to-[hsl(var(--knowsy-purple))] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <benefit.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-heading text-2xl">{benefit.title}</h3>
                  <p className="font-body text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-heading text-4xl md:text-5xl mb-4">
              <span className="bg-gradient-to-r from-[hsl(var(--knowsy-yellow))] to-[hsl(var(--knowsy-red))] bg-clip-text text-transparent">
                {t('organizations.useCases.title')}
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card>
              <CardContent className="p-6 space-y-3">
                <h3 className="font-heading text-xl">{t('organizations.useCases.teamMeetings.title')}</h3>
                <p className="font-body text-muted-foreground">{t('organizations.useCases.teamMeetings.description')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-3">
                <h3 className="font-heading text-xl">{t('organizations.useCases.companyRetreats.title')}</h3>
                <p className="font-body text-muted-foreground">{t('organizations.useCases.companyRetreats.description')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-3">
                <h3 className="font-heading text-xl">{t('organizations.useCases.virtualEvents.title')}</h3>
                <p className="font-body text-muted-foreground">{t('organizations.useCases.virtualEvents.description')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-3">
                <h3 className="font-heading text-xl">{t('organizations.useCases.onboarding.title')}</h3>
                <p className="font-body text-muted-foreground">{t('organizations.useCases.onboarding.description')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-3">
                <h3 className="font-heading text-xl">{t('organizations.useCases.happyHours.title')}</h3>
                <p className="font-body text-muted-foreground">{t('organizations.useCases.happyHours.description')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-3">
                <h3 className="font-heading text-xl">{t('organizations.useCases.trainingSessions.title')}</h3>
                <p className="font-body text-muted-foreground">{t('organizations.useCases.trainingSessions.description')}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-to-br from-[hsl(var(--knowsy-blue))]/20 to-[hsl(var(--knowsy-purple))]/20 border-2">
            <CardContent className="p-12 text-center space-y-6">
              <h2 className="font-heading text-4xl md:text-5xl">
                {t('organizations.cta.title')}
              </h2>
              <p className="text-xl text-muted-foreground font-body max-w-2xl mx-auto">
                {t('organizations.cta.description')}
              </p>
              <div className="flex flex-wrap gap-4 justify-center pt-4">
                <Link to="/apply">
                  <Button variant="hero" size="lg">
                    {t('organizations.cta.applyNow')}
                  </Button>
                </Link>
                <Link to="/contact-sales">
                  <Button variant="outline" size="lg">
                    {t('organizations.cta.talkToSales')}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Organizations;
