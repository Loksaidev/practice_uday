import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, BarChart3, TrendingUp, Users, Clock } from "lucide-react";

const Analytics = () => {
  const navigate = useNavigate();

  const features = [
    { icon: BarChart3, title: "Detailed Reports", description: "Comprehensive analytics and insights" },
    { icon: TrendingUp, title: "Performance Tracking", description: "Monitor player performance over time" },
    { icon: Users, title: "User Insights", description: "Understand player behavior and engagement" },
    { icon: Clock, title: "Real-time Data", description: "Live updates and instant reporting" }
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
                Advanced Analytics
              </span>
            </h1>
            <p className="text-xl text-muted-foreground font-body">
              Gain insights into player engagement and performance
            </p>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-all">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-heading text-lg">{feature.title}</h3>
                  <p className="font-body text-sm text-muted-foreground">{feature.description}</p>
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
              <h2 className="font-heading text-4xl">Unlock Your Data</h2>
              <p className="text-lg text-muted-foreground font-body">
                Get started with analytics to understand your players better
              </p>
              <Button variant="hero" size="lg">
                View Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Analytics;
