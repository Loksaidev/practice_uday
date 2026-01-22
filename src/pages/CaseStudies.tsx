import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Star } from "lucide-react";

const CaseStudies = () => {
  const navigate = useNavigate();

  const studies = [
    {
      company: "Tech Startup Inc",
      result: "40% increase in team engagement",
      description: "Used Knowsy for weekly team meetings to boost morale and connection."
    },
    {
      company: "Global Corp",
      result: "Improved onboarding by 60%",
      description: "Integrated Knowsy into their new hire onboarding program."
    },
    {
      company: "Creative Agency",
      result: "Enhanced company culture",
      description: "Made Knowsy a staple of their monthly all-hands meetings."
    },
    {
      company: "Enterprise Solutions",
      result: "500+ employees engaged",
      description: "Deployed white-label solution across the organization."
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
                Case Studies
              </span>
            </h1>
            <p className="text-xl text-muted-foreground font-body">
              See how organizations are transforming with Knowsy
            </p>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {studies.map((study, index) => (
              <Card key={index} className="hover:shadow-lg transition-all">
                <CardContent className="p-6 space-y-4">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <h3 className="font-heading text-lg">{study.company}</h3>
                  <p className="font-body text-sm text-muted-foreground">{study.description}</p>
                  <p className="font-heading text-primary">{study.result}</p>
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
              <h2 className="font-heading text-4xl">Ready to Write Your Success Story?</h2>
              <p className="text-lg text-muted-foreground font-body">
                Join hundreds of organizations achieving their goals with Knowsy
              </p>
              <Button variant="hero" size="lg">
                Get Started Today
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CaseStudies;
