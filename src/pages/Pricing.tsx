import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Check } from "lucide-react";

const Pricing = () => {
  const navigate = useNavigate();

  const plans = [
    {
      name: "Free",
      price: "0",
      description: "Perfect for casual players",
      features: [
        "Up to 10 players per game",
        "Access to basic topics",
        "Limited games per month",
        "Community support",
        "Basic leaderboards"
      ],
      cta: "Get Started",
      highlighted: false
    },
    {
      name: "Pro",
      price: "9.99",
      description: "For serious gamers",
      features: [
        "Up to 50 players per game",
        "All topics included",
        "Unlimited games",
        "Priority support",
        "Advanced leaderboards",
        "Custom game creation",
        "Ad-free experience"
      ],
      cta: "Start Free Trial",
      highlighted: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For organizations",
      features: [
        "Unlimited players",
        "All Pro features",
        "Custom branding",
        "Dedicated support",
        "Advanced analytics",
        "Team management",
        "API access",
        "Custom integrations"
      ],
      cta: "Contact Sales",
      highlighted: false
    }
  ];

  return (
    <div className="min-h-screen">
      <Header />

      {/* Back Button */}
      <div className="bg-muted/30 border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-body"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <section className="pt-32 pb-16 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--knowsy-blue))]/10 via-background to-[hsl(var(--knowsy-purple))]/10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            <h1 className="font-heading text-5xl md:text-6xl">
              <span className="bg-gradient-to-r from-[hsl(var(--knowsy-blue))] via-[hsl(var(--knowsy-purple))] to-[hsl(var(--knowsy-red))] bg-clip-text text-transparent">
                Simple, Transparent Pricing
              </span>
            </h1>
            <p className="text-xl text-muted-foreground font-body">
              Choose the perfect plan for your needs. No hidden fees.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card
                key={index}
                className={`relative transition-all duration-300 ${
                  plan.highlighted
                    ? "md:scale-105 border-2 border-primary shadow-xl"
                    : "hover:shadow-lg"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-[hsl(var(--knowsy-blue))] to-[hsl(var(--knowsy-purple))] text-white px-4 py-1 rounded-full text-sm font-heading">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardContent className="p-8 space-y-6">
                  <div>
                    <h3 className="font-heading text-2xl mb-2">{plan.name}</h3>
                    <p className="text-muted-foreground font-body text-sm">{plan.description}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-baseline gap-1">
                      <span className="font-heading text-4xl">${plan.price}</span>
                      {plan.price !== "Custom" && (
                        <span className="text-muted-foreground font-body">/month</span>
                      )}
                    </div>
                  </div>

                  <Button
                    variant={plan.highlighted ? "hero" : "outline"}
                    className="w-full"
                  >
                    {plan.cta}
                  </Button>

                  <div className="space-y-3 pt-4 border-t border-border">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="font-body text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-heading text-4xl md:text-5xl mb-4">
              <span className="bg-gradient-to-r from-[hsl(var(--knowsy-blue))] to-[hsl(var(--knowsy-purple))] bg-clip-text text-transparent">
                Frequently Asked Questions
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-6 space-y-3">
                <h3 className="font-heading text-lg">Can I upgrade or downgrade anytime?</h3>
                <p className="font-body text-muted-foreground text-sm">
                  Yes! You can change your plan at any time. Changes take effect immediately.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-3">
                <h3 className="font-heading text-lg">Is there a free trial?</h3>
                <p className="font-body text-muted-foreground text-sm">
                  Yes, Pro plan includes a 14-day free trial. No credit card required.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-3">
                <h3 className="font-heading text-lg">What payment methods do you accept?</h3>
                <p className="font-body text-muted-foreground text-sm">
                  We accept all major credit cards, PayPal, and bank transfers for Enterprise.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-3">
                <h3 className="font-heading text-lg">Do you offer refunds?</h3>
                <p className="font-body text-muted-foreground text-sm">
                  Yes, 30-day money-back guarantee if you're not satisfied.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Pricing;
