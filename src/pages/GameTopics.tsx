import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Brain, Heart, Briefcase, Users, Zap, Lightbulb } from "lucide-react";

const GameTopics = () => {
  const navigate = useNavigate();

  const categories = [
    {
      icon: Brain,
      name: "Trivia",
      description: "Test your knowledge with questions spanning history, science, and pop culture."
    },
    {
      icon: Heart,
      name: "Personal",
      description: "Get to know each other better with fun and thoughtful questions."
    },
    {
      icon: Briefcase,
      name: "Professional",
      description: "Perfect for team building and corporate events."
    },
    {
      icon: Users,
      name: "Social",
      description: "Connect with friends through engaging conversations."
    },
    {
      icon: Zap,
      name: "Quick Fire",
      description: "Fast-paced questions for rapid-fire gameplay."
    },
    {
      icon: Lightbulb,
      name: "Creative",
      description: "Unleash your creativity with imaginative questions."
    }
  ];

  return (
    <div className="min-h-screen">
      <Header />

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

      <section className="pt-32 pb-16 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--knowsy-blue))]/10 via-background to-[hsl(var(--knowsy-purple))]/10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            <h1 className="font-heading text-5xl md:text-6xl">
              <span className="bg-gradient-to-r from-[hsl(var(--knowsy-blue))] via-[hsl(var(--knowsy-purple))] to-[hsl(var(--knowsy-red))] bg-clip-text text-transparent">
                Game Topics
              </span>
            </h1>
            <p className="text-xl text-muted-foreground font-body">
              Explore diverse topics or create your own custom questions
            </p>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((category, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all">
                <CardContent className="p-6 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[hsl(var(--knowsy-blue))] to-[hsl(var(--knowsy-purple))] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <category.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-heading text-xl">{category.name}</h3>
                  <p className="font-body text-muted-foreground text-sm">{category.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <Card className="max-w-3xl mx-auto">
            <CardContent className="p-12 text-center space-y-6">
              <h2 className="font-heading text-4xl">
                <span className="bg-gradient-to-r from-[hsl(var(--knowsy-blue))] to-[hsl(var(--knowsy-purple))] bg-clip-text text-transparent">
                  Create Custom Topics
                </span>
              </h2>
              <p className="text-lg text-muted-foreground font-body">
                Make Knowsy your own by creating custom question sets tailored to your interests.
              </p>
              <Button variant="hero" size="lg">
                Start Creating
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default GameTopics;
