import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import GameDetails from "@/components/GameDetails";
import Section from "@/components/Section";
import HowToPlay from "@/components/HowToPlay";
import PhysicalGame from "@/components/physical_game";

import Custom_Knowsy_Game from "@/components/Custom_Knowsy_Game";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import NewsletterSection from "@/components/drop_your_mail";
import { Card, CardContent } from "@/components/ui/card";

import { useTranslation } from "react-i18next";
import { Heart, Sparkles, Trophy, Users } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
const Index = () => {
  const { t } = useTranslation();

  const faqs = [
    {
      question: t("faq.q1"),
      answer: t("faq.a1"),
    },
    {
      question: t("faq.q2"),
      answer: t("faq.a2"),
    },
    {
      question: t("faq.q3"),
      answer: t("faq.a3"),
    },
    {
      question: t("faq.q4"),
      answer: t("faq.a4"),
    },
    {
      question: t("faq.q5"),
      answer: t("faq.a5"),
    },
  ];

  return (
    <div className="min-h-screen">
      <Header />
      <div className="pt-16">
        <Hero />
        <Features />
        <GameDetails />
        <Section />
        <HowToPlay />
        <PhysicalGame />
        <Custom_Knowsy_Game />
        <CTA />
        <NewsletterSection />
        <Footer />
      </div>
    </div>
  );
};

export default Index;
