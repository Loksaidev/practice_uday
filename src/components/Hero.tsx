import greenAvatar from "@/assets/images/circle_avatars/green.png";
import redAvatar from "@/assets/images/circle_avatars/red.png";
import yellowAvatar from "@/assets/images/circle_avatars/yellow.png";
import blueAvatar from "@/assets/images/circle_avatars/blue.png";
import pinkAvatar from "@/assets/images/circle_avatars/pink.png";
import { useTranslation } from "react-i18next";

import { useNavigate } from "react-router-dom";

function Hero() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Font setup

  // Main Typography
  const mainTextStyle = `
    font-['Slackey']
    text-[36px] md:text-7xl lg:text-7xl min-[2000px]:text-9xl
    text-black
    text-center
    relative
    z-10
  `;

  // Button Base Styles
  const buttonBaseStyle = `
    font-['Slackey']
    text-2xl md:text-3xl min-[2000px]:text-6xl
    py-2 px-16 min-[2000px]:px-24
    rounded-full
    transition-transform
    hover:scale-105
    shadow-[0_4px_4px_0_rgba(0,0,0,0.25)]
    md:min-w-[400px] min-[2000px]:min-w-[650px]
    text-center
  `;

  return (
    <section className="w-full h-[94vh] md:h-[75vh] lg:h-[calc(100vh-64px)] min-[2000px]:h-[95vh] flex flex-col items-center justify-start min-[2000px]:justify-start bg-transparent p-0 relative overflow-hidden">
      <div className="w-full pt-20 md:pt-32 lg:pt-16 lg:mt-8 min-[2000px]:mt-0 min-[2000px]:pt-24 flex flex-col items-center justify-center bg-transparent p-4 relative overflow-hidden">
        {/* --- Main Content Wrapper ---
          We use 'relative' here so the absolute positioned avatars
          stay anchored to this specific block of text.
      */}
        <div className="relative max-w-4xl min-[2000px]:max-w-7xl mx-auto mb-16 mt-10 min-[2000px]:mb-24">
          {/* --- 1. The Floating Avatars --- */}

          {/* Green: Top Left (near "How") */}
          <img
            src={greenAvatar}
            alt="Green Avatar"
            className="absolute -top-12 -left-12 md:-top-16 md:-left-20 w-20 md:w-32 lg:w-[160px] lg:-top-[65px] lg:-left-[105px] min-[2000px]:w-[250px] min-[2000px]:-top-[80px] min-[2000px]:-left-[160px] z-20 transform -rotate-12"
          />

          {/* Red: Top Right (near "do") */}
          <img
            src={redAvatar}
            alt="Red Avatar"
            className="absolute -top-16 right-4 md:right-0 md:-top-[84px] lg:right-[50px] lg:-top-[86px] w-20 md:w-28 min-[2000px]:w-48 min-[2000px]:-top-[151px] min-[2000px]:right-65 z-20 transform rotate-12"
          />

          {/* Yellow: Middle Left (near "your") */}
          <img
            src={yellowAvatar}
            alt="Yellow Avatar"
            className="absolute top-20 -left-[58px] md:-left-[90px] md:top-[160px] w-20 md:w-32 lg:top-[160px] lg:-left-[140px] lg:w-[180px] min-[2000px]:w-[280px] min-[2000px]:top-[290px] min-[2000px]:-left-[210px] z-20 -translate-y-1/2"
          />

          {/* Blue: Middle Right (near "family") */}
          <img
            src={blueAvatar}
            alt="Blue Avatar"
            className="absolute top-[2px] -right-[60px] md:-right-24 md:top-10 w-24 md:w-36 lg:w-[200px] lg:top-[0px] lg:-right-32 min-[2000px]:w-[300px] min-[2000px]:-right-60 min-[2000px]:top-14 z-20 transform rotate-6"
          />

          {/* Pink: Bottom Center/Right (near "friends") */}
          <img
            src={pinkAvatar}
            alt="Pink Avatar"
            className="absolute -bottom-[72px]  right-[18px] md:right-[80px] md:bottom-[-90px] lg:right-[50px] w-24 md:w-32 min-[2000px]:w-56 min-[2000px]:right-35 min-[2000px]:-bottom-[155px] z-20 transform -rotate-6"
          />

          {/* --- 2. The Text --- */}
          <h1 className={mainTextStyle} style={{ lineHeight: 0.85 }}>
            {t("hero.titleLine1")} <br />
            {t("hero.titleLine2")} <br />
            {t("hero.titleLine3")} <br />
            {t("hero.titleLine4")}
          </h1>
        </div>

        {/* --- 3. Action Buttons --- */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-12 z-20 mt-8 min-[2000px]:mt-24">
          {/* Start Playing Button: Black bg, Yellow Text */}
          <button
            onClick={() => navigate('/play')}
            className={`${buttonBaseStyle} bg-black text-[#FCC804] border-2 border-black`}
          >
            {t("hero.startPlaying")}
          </button>

          {/* Buy Game Button: White bg, Yellow Text, Yellow Border */}
          <button
            onClick={() => navigate('/store')}
            className={`${buttonBaseStyle} bg-white text-[#FCC804] border-[3px] border-[#FCC804]`}
          >
            {t("hero.buyGame")}
          </button>
        </div>
      </div>
    </section>
  );
}

export default Hero;
