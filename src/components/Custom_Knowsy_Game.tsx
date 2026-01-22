import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import kCardImage from '../assets/images/custom_knowsy/k_card.png';

// NOTE: Replace this path with the actual public path or imported image file
// The image file is expected to contain the three overlapping cards as one graphic.
const K_CARD_GROUP_IMAGE_PATH = '/path/to/k_card_group.png'; // Assuming a filename change for clarity

interface KnowsyCustomGameProps {
  // You can add props here if the content or styles needed to be dynamic
}

const KnowsyCustomGame: React.FC<KnowsyCustomGameProps> = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isDesktop, setIsDesktop] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkDesktop();
    checkMobile();
    window.addEventListener('resize', checkDesktop);
    window.addEventListener('resize', checkMobile);
    return () => {
      window.removeEventListener('resize', checkDesktop);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  const descriptionText = isDesktop ? <>Create a branded Knowsy game for your organization: custom boxes,<br />custom cards, and content tailored to your culture or audience.</> : isMobile ? <>Create a branded Knowsy game for<br /> your organization: custom boxes,<br />custom cards, and content tailored to<br /> your culture or audience.</> : <>Create a branded Knowsy game for your organization: custom boxes,<br />custom cards, and content tailored to your culture or audience.</>;
  const buttonText = t("customKnowsyGame.button");

  return (
    // Background Layout (width: 1538, height: 607, background: #FCC804)
    <div className="relative mx-auto max-w-full min-h-[500px] md:min-h-[700px] bg-[#FCC804] flex flex-col justify-start items-center pt-36 md:pt-64 pb-10 md:pb-16 overflow-x-hidden overflow-y-auto">

      {/* Absolute positioned elements (Pink background and Cards) */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">

        {/* Pink background part (background: #ED908A) */}
        {/* Based on the screenshot, this pink background fills the top banner area */}
        <div className="absolute top-0 left-0 w-full h-20 md:h-32 lg:h-36 bg-[#ED908A]"></div>

        {/* Single Knowsy Game Card */}
        <img
          src={kCardImage}
          alt="Knowsy Game Card"
          className="w-[160px] h-[128px] md:w-80 md:h-80 lg:w-[400px] lg:h-[350px] absolute top-[10px] md:top-[15px] lg:top-[43px] left-[-20px] md:left-[-20px] lg:left-[10px] rotate-[-6deg]"
          style={{
            filter: 'drop-shadow(2px 2px 5px rgba(0,0,0,0.3))'
          }}
        />
      </div>

      {/* Main Content Container (z-index ensures it sits above absolute elements) */}
      <div className="z-30 flex flex-col items-center max-w-4xl text-center px-4">

        {/* Custom Knowsy Game Boxes & Cards */}
        {/* Typography: Slackey, 60px, color: #4D400D, center-aligned */}
        <h1
          className="font-slackey text-3xl md:text-4xl lg:text-5xl xl:text-6xl leading-tight text-[#4D400D] text-center mt-4 md:mt-10 lg:-mt-0"
          style={{
            // Layout: width: 1075, height: 144
            height: 'auto',
            maxWidth: '100%',
          }}
        >
          {isMobile ? (
            <>
              <span>Custom Knowsy</span><br /><span>Game Boxes</span><br /><span>& Cards</span>
            </>
          ) : (
            <>
              <span>Custom Knowsy</span><br className="hidden md:inline" /><span> Game Boxes & Cards</span>
            </>
          )}
        </h1>

        {/* Create a branded Knowsy game... */}
        {/* Typography: Annie Use Your Telescope, 30px, color: #000000, center-aligned */}
        <p
          className="font-annie text-lg md:text-2xl lg:text-2xl xl:text-3xl leading-[130%] text-black text-center mt-4 md:mt-12"
          style={{
            maxWidth: '100%',
          }}
        >
          {descriptionText}
        </p>

        {/* Contact Sales Button/Link */}
        {/* Layout: Button Wrapper (456x81, border-radius: 50px, background: #000000, shadow) */}
        {/* Text/Border (40px Slackey, color: #FCC804, border: 0.5px solid #FCC804) */}
        <button
          onClick={() => navigate("/contact-sales")}
          className="relative mt-4 md:mt-12 xl:mt-16 group w-72 md:w-96 lg:w-96 xl:w-[456px] h-12 md:h-20 lg:h-20 hover:opacity-80 active:scale-95 transition-all cursor-pointer"
          style={{
            borderRadius: '50px',
            background: '#000000',
            boxShadow: '4px 7px 4px 0px #00000040',
            maxWidth: '90%',
          }}
        >
          <div
            className="flex items-center justify-center h-full"
            style={{
              border: '0.5px solid #FCC804',
              borderRadius: '50px',
              padding: '0 15px md:0 20px lg:0 30px',
            }}
          >
            <span className="font-slackey text-2xl md:text-4xl lg:text-3xl xl:text-4xl leading-[100%] text-[#FCC804] text-center" style={{WebkitTextStroke: '0px black'}}>
              {buttonText}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default KnowsyCustomGame;


