import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import imgImg26862 from "../assets/physical_game/avatar.png";
import imgGroupOfBoxes from "../assets/physical_game/groupof_boxes.png";
import imgGroupOfCards from "../assets/physical_game/groupof_cards.png";

export default function PhysicalGameLanding() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="w-full min-h-[1200px] md:min-h-[1400px] overflow-hidden relative font-sans">

      {/* --- Background Layers --- */}

      {/* 1. Top Pink Section */}
      <div className="absolute top-0 left-0 w-full h-[120px] md:h-[200px] bg-[#e9a6e5] z-0" />

      {/* 2. Middle Dark Section */}
      <div className="absolute top-[120px] md:top-[200px] left-0 w-full h-[700px] md:h-[800px] lg:h-[600px] bg-[#363636] z-0" />

      {/* 3. Bottom Coral Section */}
      <div className="absolute top-[820px] md:top-[1000px] lg:top-[800px] left-0 w-full h-[400px] md:h-full bg-[#ed908a] z-0" />

      {/* --- Main Content Container --- */}
      <div className="relative z-10 max-w-[1440px] mx-auto w-full h-full">

        {/* --- Top Right Logo Badge --- */}
        <div className="absolute block right-[-20px] w-[200px] h-[200px] top-[40px] md:top-0 md:right-[-50px] md:w-[400px] md:h-[400px]">
          <img src={imgImg26862} alt="Logo Character" className="w-full h-full object-contain rotate-[2deg]" />
        </div>

        {/* --- SECTION 1: "Want the Physical Game?" (Dark Background Area) --- */}
        <div className="absolute top-[200px] md:top-[280px] left-[5%] md:left-[100px] max-w-[600px] text-white">
          <h1 className="font-['Slackey',sans-serif] text-[30px] md:text-[48px] lg:text-[60px] leading-[1.2] mb-6 lg:whitespace-nowrap">
            {t("physicalGame.heading")}
          </h1>

          <div className="font-handwriting text-[20px] md:text-[24px] font-light mb-10 space-y-2 opacity-90 hidden lg:block" style={{ fontFamily: '"Annie Use Your Telescope", cursive' }}>
            <p>{t("physicalGame.experience")}</p>
            <p>{t("physicalGame.shopDescription")}</p>
          </div>
          <div className="font-handwriting text-[24px] font-light mb-10 space-y-2 opacity-90 hidden md:block lg:hidden" style={{ fontFamily: '"Annie Use Your Telescope", cursive' }}>
            <p>{t("physicalGame.experienceTablet")}</p>
            <p>{t("physicalGame.shopDescriptionTablet")}</p>
          </div>

          <div className="hidden md:block">
            <button onClick={() => navigate('/store')} className="group relative inline-block">
              <div className="absolute inset-0 border-[5px] border-[#fcc804] rounded-[50px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] translate-y-1 translate-x-0"></div>
              <div className="relative px-10 py-4 rounded-[50px]">
                <span className="font-['Slackey',sans-serif] text-[#fcc804] text-[28px] md:text-[36px]">
                  {t("physicalGame.shopNow")}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Group of Cards for Mobile */}
        <div className="absolute top-[280px] right-[-60px] w-[300px] z-10 block md:hidden">
          <img src={imgGroupOfCards} alt="Group of Cards" className="w-full h-auto drop-shadow-xl" />
        </div>

        {/* Text and Button below image for Mobile */}
        <div className="absolute top-[500px] left-[5%] max-w-[600px] text-white block md:hidden">
          <div className="font-handwriting text-[20px] font-light mb-6 space-y-2 opacity-90" style={{ fontFamily: '"Annie Use Your Telescope", cursive' }}>
            <p>{t("physicalGame.experience")}</p>
            <p>{t("physicalGame.shopDescriptionMobile1")}</p>
            <p>{t("physicalGame.shopDescriptionMobile2")}</p>
          </div>

          <button onClick={() => navigate('/store')} className="group relative inline-block">
            <div className="absolute inset-0 border-[5px] border-[#fcc804] rounded-[50px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] translate-y-1 translate-x-0"></div>
            <div className="relative px-8 py-3 rounded-[50px]">
              <span className="font-['Slackey',sans-serif] text-[#fcc804] text-[20px]">
                {t("physicalGame.shopNow")}
              </span>
            </div>
          </button>
        </div>

        {/* --- SECTION 2: "Already Own the Game?" (Coral Background Area) - Original for Mobile and Desktop --- */}
        <div className="absolute top-[900px] left-[5%] lg:left-[100px] max-w-[650px] text-white hidden lg:block">
          <h2 className="font-['Slackey',sans-serif] text-[40px] lg:text-[60px] leading-[1.2] mb-6">
            {t("physicalGame.alreadyOwn")}
          </h2>

          <div className="font-handwriting text-[20px] lg:text-[24px] font-light mb-5 max-w-[500px] opacity-90" style={{ fontFamily: '"Annie Use Your Telescope", cursive', color: '#77332F' }}>
            <p>{t("physicalGame.extendDescription")}</p>
          </div>

          <button onClick={() => navigate('/qrcode')} className="group relative inline-block">
            <div className="absolute inset-0 border-[5px] border-white rounded-[50px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] translate-y-0 translate-x-0 transition-transform"></div>
            <div className="relative px-12 py-4 rounded-[50px]">
              <span className="font-['Slackey',sans-serif] text-white text-[28px] lg:text-[40px] whitespace-nowrap">
                  {t("physicalGame.extendButton")}
                </span>
            </div>
          </button>
        </div>

        {/* --- SECTION 2: "Already Own the Game?" (Coral Background Area) - Mobile Centered --- */}
        <div className="absolute top-[880px] left-1/2 -translate-x-1/2 w-full max-w-[650px] text-white text-center block md:hidden">
          <h2 className="font-['Slackey',sans-serif] text-[24px] leading-[1.2] mb-10 whitespace-nowrap">
            {t("physicalGame.alreadyOwnMobile")}
          </h2>

          <div className="font-handwriting text-[20px] font-light mb-10 max-w-[500px] opacity-90 mx-auto" style={{ fontFamily: '"Annie Use Your Telescope", cursive', color: '#77332F' }}>
            <p>{t("physicalGame.extendDescriptionMobile1")}</p>
            <p>{t("physicalGame.extendDescriptionMobile2")}</p>
            <p>{t("physicalGame.extendDescriptionMobile3")}</p>
            <p>{t("physicalGame.extendDescriptionMobile4")}</p>
            <p>{t("physicalGame.extendDescriptionMobile5")}</p>
          </div>

          <button onClick={() => navigate('/qrcode')} className="group relative inline-block">
            <div className="absolute inset-0 border-[3px] border-white rounded-[50px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] translate-y-0 translate-x-0 transition-transform"></div>
            <div className="relative px-4 py-2 rounded-[50px]">
              <span className="font-['Slackey',sans-serif] text-white text-[20px] whitespace-nowrap">
                {t("physicalGame.extendButton")}
              </span>
            </div>
          </button>
        </div>

        {/* --- SECTION 2: "Already Own the Game?" (Coral Background Area) - Tablet Centered --- */}
        <div className="absolute top-[1050px] left-1/2 -translate-x-1/2 w-full max-w-[650px] text-white text-center hidden md:block lg:hidden">
          <h2 className="font-['Slackey',sans-serif] text-[48px] leading-[1.2] mb-10 whitespace-nowrap">
            {t("physicalGame.alreadyOwn")}
          </h2>

          <div className="font-handwriting text-[24px] font-light mb-10 max-w-[500px] opacity-90 mx-auto" style={{ fontFamily: '"Annie Use Your Telescope", cursive', color: '#77332F' }}>
            <p>{t("physicalGame.extendDescriptionTablet1")}</p>
            <p>{t("physicalGame.extendDescriptionTablet2")}</p>
            <p>{t("physicalGame.extendDescriptionTablet3")}</p>
          </div>

          <button onClick={() => navigate('/qrcode')} className="group relative inline-block">
            <div className="absolute inset-0 border-[5px] border-white rounded-[50px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] translate-y-0 translate-x-0 transition-transform"></div>
            <div className="relative px-8 py-4 rounded-[50px]">
              <span className="font-['Slackey',sans-serif] text-white text-[40px] whitespace-nowrap">
                {t("physicalGame.extendButton")}
              </span>
            </div>
          </button>
        </div>

        {/* --- IMAGE COLLAGE LAYER --- */}
        {/* Using absolute positioning to recreate the scattered art-direction */}

        {/* Group of Boxes */}
        <div className="absolute top-[680px] md:top-[775px] lg:top-[575px] left-[-210px] md:left-[-350px] w-[600px] md:w-[900px] z-10">
          <img src={imgGroupOfBoxes} alt="Group of Boxes" className="w-full h-auto drop-shadow-xl" />
        </div>

        {/* Group of Cards */}
        <div className="absolute top-[510px] right-[-200px] md:right-[-200px] w-[700px] md:w-[900px] z-10 hidden lg:block">
          <img src={imgGroupOfCards} alt="Group of Cards" className="w-full h-auto drop-shadow-xl" />
        </div>

        {/* Group of Cards for Tablets */}
        <div className="absolute top-[400px] left-[450px] w-[400px] z-10 block lg:hidden">
          <img src={imgGroupOfCards} alt="Group of Cards" className="w-full h-auto drop-shadow-xl" />
        </div>

      </div>
    </div>
  );
}