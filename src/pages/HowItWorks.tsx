import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Sparkles, Users, Trophy, Zap } from "lucide-react";

const HowItWorks = () => {
  const navigate = useNavigate();

  const steps = [
    {
      icon: Users,
      title: "Create or Join a Game",
      description: "Start a new game room or join an existing one using a room code. Invite your friends or colleagues to join the fun."
    },
    {
      icon: Sparkles,
      title: "Choose Your Topics",
      description: "Select from our curated collection of engaging topics or create your own custom questions for a personalized experience."
    },
    {
      icon: Trophy,
      title: "Play & Compete",
      description: "Answer questions, earn points, and climb the leaderboard. Compete individually or as teams for maximum fun."
    },
    {
      icon: Zap,
      title: "Share & Celebrate",
      description: "Celebrate wins, share moments, and create lasting memories with your community."
    }
  ];

  const features = [
    {
      title: "Real-time Multiplayer",
      description: "Play simultaneously with friends across different devices and locations"
    },
    {
      title: "Customizable Topics",
      description: "Create your own question sets tailored to your interests or organization"
    },
    {
      title: "Instant Leaderboards",
      description: "Track scores in real-time and see who's leading the competition"
    },
    {
      title: "Mobile Friendly",
      description: "Play on any device - desktop, tablet, or smartphone"
    },
    {
      title: "No Installation",
      description: "Start playing immediately in your browser without any downloads"
    },
    {
      title: "Social Sharing",
      description: "Share your achievements and invite friends to join the fun"
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
                How Knowsy Works
              </span>
            </h1>
            <p className="text-xl text-muted-foreground font-body">
              Get started in minutes and start playing with your community
            </p>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[hsl(var(--knowsy-blue))] to-[hsl(var(--knowsy-purple))] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <step.icon className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-3xl font-heading text-muted-foreground/30">{index + 1}</span>
                  </div>
                  <h3 className="font-heading text-xl">{step.title}</h3>
                  <p className="font-body text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-heading text-4xl md:text-5xl mb-4">
              <span className="bg-gradient-to-r from-[hsl(var(--knowsy-blue))] to-[hsl(var(--knowsy-purple))] bg-clip-text text-transparent">
                Packed with Features
              </span>
            </h2>
            <p className="text-xl text-muted-foreground font-body max-w-2xl mx-auto">
              Everything you need for an amazing gaming experience
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index}>
                <CardContent className="p-6 space-y-3">
                  <h3 className="font-heading text-lg">{feature.title}</h3>
                  <p className="font-body text-muted-foreground">{feature.description}</p>
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
                Ready to Get Started?
              </h2>
              <p className="text-xl text-muted-foreground font-body max-w-2xl mx-auto">
                Join thousands of players enjoying Knowsy today
              </p>
              <Button variant="hero" size="lg">
                Start Playing Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HowItWorks;
