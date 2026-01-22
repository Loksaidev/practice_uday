import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// --- Asset Imports ---
import groupOfCards from '../assets/group_of_cards.png'; // The 3 cards fan
import singleCard from '../assets/k_card.png';           // The single card for the corner

// --- Font Imports ---
import slackeyFont from '../assets/fonts/Slackey-Regular.ttf';
import annieFont from '../assets/fonts/AnnieUseYourTelescope-Regular.ttf';

const HowToPlaySection: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // --- Configuration ---
  const colors = {
    bg: '#E9A6E5',        // Main Pink Background
    heading: '#813B81',   // Dark Purple for titles
    body: '#000000',      // Black for description
    buttonText: '#FCC804',// Yellow for button text
    buttonBg: '#000000'   // Black for button background
  };

  const steps = [
    {
      title: t("howToPlay.step1.title"),
      titleMobile: t("howToPlay.step1.titleMobile"),
      titleTablet: t("howToPlay.step1.titleTablet"),
      desc: t("howToPlay.step1.desc"),
      descMobile: t("howToPlay.step1.descMobile"),
      descTablet: t("howToPlay.step1.descTablet")
    },
    {
      title: t("howToPlay.step2.title"),
      titleMobile: t("howToPlay.step2.titleMobile"),
      titleTablet: t("howToPlay.step2.titleTablet"),
      desc: t("howToPlay.step2.desc"),
      descMobile: t("howToPlay.step2.descMobile"),
      descTablet: t("howToPlay.step2.descTablet")
    },
    {
      title: t("howToPlay.step3.title"),
      titleMobile: t("howToPlay.step3.titleMobile"),
      titleTablet: t("howToPlay.step3.titleTablet"),
      desc: t("howToPlay.step3.desc"),
      descMobile: t("howToPlay.step3.descMobile"),
      descTablet: t("howToPlay.step3.descTablet")
    },
    {
      title: t("howToPlay.step4.title"),
      titleMobile: t("howToPlay.step4.titleMobile"),
      titleTablet: t("howToPlay.step4.titleTablet"),
      desc: t("howToPlay.step4.desc"),
      descMobile: t("howToPlay.step4.descMobile"),
      descTablet: t("howToPlay.step4.descTablet")
    },
    {
      title: t("howToPlay.step5.title"),
      titleMobile: t("howToPlay.step5.titleMobile"),
      titleTablet: t("howToPlay.step5.titleTablet"),
      desc: t("howToPlay.step5.desc"),
      descMobile: t("howToPlay.step5.descMobile"),
      descTablet: t("howToPlay.step5.descTablet")
    },
    {
      title: t("howToPlay.step6.title"),
      titleMobile: t("howToPlay.step6.titleMobile"),
      titleTablet: t("howToPlay.step6.titleTablet"),
      desc: t("howToPlay.step6.desc"),
      descMobile: t("howToPlay.step6.descMobile"),
      descTablet: t("howToPlay.step6.descTablet")
    }
  ];

  // Font Injection
  const fontStyles = `
    @font-face {
      font-family: 'Slackey';
      src: url(${slackeyFont}) format('truetype');
    }
    @font-face {
      font-family: 'AnnieUseYourTelescope';
      src: url(${annieFont}) format('truetype');
    }
  `;

  return (
    <div
      className="w-full relative overflow-hidden pt-20 pb-2.5 px-6 md:px-12"
      style={{ backgroundColor: colors.bg }}
    >
      <style>{fontStyles}</style>

      {/* --- DECORATIONS --- */}
      
      {/* 1. Group of Cards (Top Right) */}
      <div className="absolute top-48 -right-0 md:top-40 md:right-0 pointer-events-none">
        <img
          src={groupOfCards}
          alt="Group of Cards"
          className="w-32 md:w-48 lg:w-80 transform drop-shadow-md"
        />
      </div>

      {/* 2. Single Card (Bottom Left Corner) */}
      <div className="absolute top-[32rem] -left-12 md:top-[28rem] md:-left-20 pointer-events-none lg:hidden">
        <img
          src={singleCard}
          alt="Single Card"
          className="w-20 md:w-32 lg:w-64 transform rotate-[-56.15deg] drop-shadow-md opacity-90"
        />
      </div>

      {/* 3. Single Card for Desktop */}
      <div className="absolute top-20 -left-24 lg:top-[32rem] lg:-left-40 pointer-events-none hidden md:hidden lg:block">
        <img
          src={singleCard}
          alt="Single Card"
          className="w-64 transform rotate-[38.22deg] drop-shadow-md opacity-90"
        />
      </div>


      {/* --- MAIN CONTENT --- */}
      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* Main Heading */}
        <h2
          className="font-['Slackey'] text-4xl md:text-6xl mb-12 text-center"
          style={{ color: colors.heading }}
        >
          {t("howToPlay.title")}
        </h2>

        {/* Steps List */}
        <div className="flex flex-col gap-8 md:gap-10 ml-8 md:ml-16">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col md:items-start lg:items-start">
              {/* Step Title (Purple + Slackey) */}
              <div className="relative">
                <span className="absolute left-0 font-['Slackey'] text-xl md:text-3xl leading-snug" style={{ color: colors.heading }}>
                  {index + 1}.
                </span>
                <h3
                  className="font-['Slackey'] text-xl md:text-3xl mb-1 leading-snug ml-6"
                  style={{ color: colors.heading }}
                >
                  <span className="block md:hidden lg:hidden whitespace-pre-line">{step.titleMobile}</span>
                  <span className="hidden md:block lg:hidden whitespace-pre-line">{step.titleTablet}</span>
                  <span className="hidden lg:block">{step.title}</span>
                </h3>
              </div>

              {/* Step Description (Black + Annie) */}
              <p
                className="font-['AnnieUseYourTelescope'] text-lg md:text-2xl ml-6"
                style={{ color: colors.body }}
              >
                <span className="block md:hidden lg:hidden whitespace-pre-line">{step.descMobile}</span>
                <span className="hidden md:block lg:hidden whitespace-pre-line">{step.descTablet}</span>
                <span className="hidden lg:block">{step.desc}</span>
              </p>
            </div>
          ))}
        </div>

        {/* Start Button */}
        <div className="mt-16 flex justify-center">
          <button
            onClick={() => navigate('/play')}
            className="rounded-full px-10 py-3 md:py-4 shadow-[0_4px_4px_0_rgba(0,0,0,0.25)] hover:scale-105 transition-transform duration-200"
            style={{ backgroundColor: colors.buttonBg }}
          >
            <span
              className="font-['Slackey'] text-2xl md:text-3xl tracking-wide"
              style={{ color: colors.buttonText }}
            >
              {t("howToPlay.startPlaying")}
            </span>
          </button>
        </div>

      </div>

    </div>
  );
};

export default HowToPlaySection;