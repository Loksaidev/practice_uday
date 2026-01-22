import React from "react";
import knowsyCard from "@/assets/images/misc/Cards_3.png";
import { useTranslation } from "react-i18next";

// --- Asset Imports ---
import leftYellowAvatar from "../assets/images/circle_avatars/yellow.png";
import rightYellowAvatar from "@/assets/images/circle_avatars/yellowRight.svg";
import rightYellowAvatarF from "@/assets/images/circle_avatars/YellowHF.png";

import knowsyLogo from "../assets/knowsy-logo.png";

// --- Font Imports ---

import annieFont from "../assets/fonts/AnnieUseYourTelescope-Regular.ttf";

const Features: React.FC = () => {
  const { t } = useTranslation();

  // --- Styles & Configuration ---
  const pinkBgColor = "#ED908A";
  const headingColor = "#682D26";
  const bodyTextColor = "#1F1F1F";

  const fontStyles = `
    @font-face {
      font-family: 'Slackey';

    }
    @font-face {
      font-family: 'AnnieUseYourTelescope';
      src: url(${annieFont}) format('truetype');
    }
  `;

  // Typography
  const headingStyle = `
    font-['Slackey']
    text-2xl md:text-[28px] lg:text-[42px]     
md:max-w-[442px] lg:max-w-none
    text-[#77332F]
    leading-snug
    text-[${headingColor}]
    text-center
    mb-4 md:mb-6
    drop-shadow-sm
    px-2
  `;

  const bodyTextStyle = `
    font-['AnnieUseYourTelescope']
    text-xl  md:text-[26px] lg:text-3xl   
    md:max-w-[412px] lg:max-w-none
    leading-relaxed
    text-[${bodyTextColor}]
    text-center
    max-w-4xl
    mx-auto
    px-4
  `;

  return (
    // FIX 1: Outer Wrapper
    // - overflow-x-hidden: Kills the horizontal scrollbar caused by side coins
    // - pt-36: Creates empty space at the top so the cards (which move up) aren't cut off
    // - pb-20: Creates space at the bottom for the logo
    <div className="h-full pt-0 pb-0 md:pb-0 lg:pb-20 relative overflow-visible">
      <style>{fontStyles}</style>
      {/* <div className="h-[100px] md:hidden overflow-visible">
        <div className="absolute -top-4 right-0 z-30 pointer-events-none ">
          <img
            src={knowsyCard}
            alt="Knowsy Card 1"
            className="w-[60%] md:w-[70%] lg:w-[90%] transform md:translate-x-28 lg:translate-x-0 translate-y-0 drop-shadow-md"
          />
        </div>
      </div> */}
      {/* --- Pink Section Container --- */}
      <div
        style={{ backgroundColor: pinkBgColor }}
        className="relative w-full py-16 md:py-28 px-4 flex flex-col items-center justify-center min-h-[450px] md:min-h-[550px]"
      >
        {/* --- LEFT COIN ---
            Mobile: left-0 (Visible but tight)
            Desktop: -left-4 (Full pop-out)
        */}
        <div className=" absolute top-1/3 left-0 top-2 md:top-4 lg:-left-14 lg:top-[140px] transform -translate-y-1/2 z-20">
          <img
            src={leftYellowAvatar}
            alt="Left Yellow Character Coin"
            className="w-[140px] md:w-[220px] drop-shadow-lg"
          />
        </div>

        {/* --- RIGHT COIN ---
            Mobile: right-0
            Desktop: -right-4
        */}
        <div className="hidden lg:block absolute bottom-0 right-0 z-20">
          <img
            src={rightYellowAvatar}
            alt="Right Yellow Character Coin"
            className="w-16 md:w-40 drop-shadow-lg transform "
          />
        </div>
        <div className="lg:hidden block absolute w-[160px] md:w-[260px] -bottom-16   md:-bottom-36 z-20">
          <img
            src={rightYellowAvatarF}
            alt="Right Yellow Character Coin"
            className=" drop-shadow-lg transform translate-x-[120px] md:translate-x-60 "
          />
        </div>

        {/* --- BLUE CARDS --- 
            Mobile: Positioned right-0 and scaled down
            Desktop: Positioned right-20 and larger
            -top-24 md:-top-36: They sit in the padding area we created above
        */}
        <div className=" absolute -top-20 right-[170px] md:-top-[120px] md:-right-[0px] lg:-top-[120px] lg:-right-[0px] z-30 pointer-events-none ">
          <img
            src={knowsyCard}
            alt="Knowsy Card 1"
            className="w-[260px] md:w-[34%] lg:w-[40%] transform md:translate-x-[31rem] lg:translate-x-[36rem] translate-y-0 translate-x-40 drop-shadow-md"
          />
        </div>

        {/* --- Text Content --- */}
        <div className="flex flex-col items-center justify-center z-10 max-w-5xl mx-auto mt-12 md:mt-8">
          <h2 className={headingStyle}>
            {t('features.heading')}
          </h2>

          <p className={bodyTextStyle}>
            {t('features.description')}
          </p>
        </div>

        {/* --- Bottom Logo Sticker --- 
             -bottom-10: Pushes it slightly into the bottom padding area
        */}
        <div className="absolute -bottom-10 md:-bottom-14 left-1/2 transform -translate-x-1/2 z-30">
          <img
            src={knowsyLogo}
            alt="Knowsy Logo Sticker"
            className="w-16 md:w-28 drop-shadow-md"
          />
        </div>
      </div>
    </div>
  );
};

export default Features;
