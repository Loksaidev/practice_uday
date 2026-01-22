import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Gamepad2, Users, Zap, BarChart3, Palette, Lock } from "lucide-react";

const Features = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Gamepad2,
      title: "Diverse Game Modes",
      description: "Choose from multiple game modes including trivia, word games, and more. Each mode offers unique challenges and entertainment."
    },
    {
      icon: Users,
      title: "Multiplayer Experience",
      description: "Play with friends, family, or colleagues. Support for 2-100+ players in a single game room."
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Optimized for speed and performance. Instant question delivery and real-time score updates."
    },
    {
      icon: BarChart3,
      title: "Detailed Analytics",
      description: "Track performance metrics, view statistics, and analyze gameplay patterns over time."
    },
    {
      icon: Palette,
      title: "Customization",
      description: "Personalize your experience with custom topics, themes, and game settings tailored to your preferences."
    },
    {
      icon: Lock,
      title: "Secure & Private",
      description: "Your data is encrypted and protected. Play with confidence knowing your information is safe."
    }
  ];

  const highlights = [
    {
      title: "Unlimited Topics",
      items: ["Create custom question sets", "Access curated collections", "Mix and match topics"]
    },
    {
      title: "Social Features",
      items: ["Leaderboards", "Achievement badges", "Share results with friends"]
    },
    {
      title: "Accessibility",
      items: ["Works on all devices", "Multiple language support", "Inclusive design"]
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
                Powerful Features
              </span>
            </h1>
            <p className="text-xl text-muted-foreground font-body">
              Everything you need for an unforgettable gaming experience
            </p>
          </div>
        </div>
      </section>

      {/* Main Features Grid */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[hsl(var(--knowsy-blue))] to-[hsl(var(--knowsy-purple))] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-heading text-xl">{feature.title}</h3>
                  <p className="font-body text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-heading text-4xl md:text-5xl mb-4">
              <span className="bg-gradient-to-r from-[hsl(var(--knowsy-yellow))] to-[hsl(var(--knowsy-red))] bg-clip-text text-transparent">
                What Makes Us Special
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {highlights.map((highlight, index) => (
              <Card key={index}>
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-heading text-xl">{highlight.title}</h3>
                  <ul className="space-y-2">
                    {highlight.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start gap-2 font-body text-muted-foreground">
                        <span className="text-primary mt-1">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-to-br from-[hsl(var(--knowsy-blue))]/20 to-[hsl(var(--knowsy-purple))]/20 border-2">
            <CardContent className="p-12 text-center space-y-6">
              <h2 className="font-heading text-4xl md:text-5xl">
                Experience the Difference
              </h2>
              <p className="text-xl text-muted-foreground font-body max-w-2xl mx-auto">
                Discover why thousands of players choose Knowsy for their gaming needs
              </p>
              <Button variant="hero" size="lg">
                Start Your Journey
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Features;
