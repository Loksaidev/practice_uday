import React, { useState, useEffect, useRef } from 'react';
import { useTranslation, Trans } from 'react-i18next';

// --- Font Imports ---
import slackeyFont from '../assets/fonts/Slackey-Regular.ttf';
import annieFont from '../assets/fonts/AnnieUseYourTelescope-Regular.ttf';

// --- Image Imports ---
import blueAvatar from '../assets/square_avatars/blue.png';
import greenAvatar from '../assets/square_avatars/green.png';
import pinkAvatar from '../assets/square_avatars/pink.png';
import redAvatar from '../assets/square_avatars/red.png';
import yellowAvatar from '../assets/square_avatars/yellow.png';
import firstLeftImage from '../assets/mobile_square_avatars/1st_left.png';
import secondLeftImage from '../assets/mobile_square_avatars/2nd_left.png';
import mobileGreenAvatar from '../assets/mobile_square_avatars/green.png';
import mobilePinkAvatar from '../assets/mobile_square_avatars/pink.png';
import mobileBlueAvatar from '../assets/mobile_square_avatars/blue.png';

const GameFeaturesSection: React.FC = () => {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // --- Styles & Configuration ---
  const headingColor = '#000000';
  const bodyTextColor = '#1F1F1F';

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

  // Typography Styles
  const headingStyle = `
    font-['Slackey']
    text-lg md:text-4xl
    leading-tight md:leading-snug
    text-[${headingColor}]
    text-center
    mb-3 md:mb-4
    px-4
  `;

  const bodyTextStyle = `
    font-['AnnieUseYourTelescope']
    text-base md:text-2xl
    leading-tight md:leading-relaxed
    text-[${bodyTextColor}]
    text-center
    max-w-3xl
    mx-auto
    px-6
  `;

  // Base stamp style
  const stampStyle = "absolute w-20 md:w-32 z-10 pointer-events-none";

  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        const scrollLeft = scrollContainerRef.current.scrollLeft;
        const clientWidth = scrollContainerRef.current.clientWidth;
        const newActiveIndex = Math.round(scrollLeft / clientWidth);
        setActiveIndex(newActiveIndex);
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  return (
    <div className="w-full max-w-[100vw] overflow-visible md:overflow-x-hidden relative bg-white py-6 md:pt-0 md:pb-6 lg:py-0">

      <style>{fontStyles + `
.scroll-container::-webkit-scrollbar {
 display: none;
}
`}</style>

      {/* ===========================================
           LEFT SIDE COLUMN (Green -> Red -> Pink -> Yellow -> Blue)
           ===========================================
       */}
      <div className="hidden lg:block">
        {/* Top: Green (Tilted Left) */}
        <img
          src={greenAvatar}
          alt="Green Stamp"
          className={`${stampStyle} top-0 -left-5 rotate-[23deg]`}
        />

        {/* Middle: Red (Tilted Right) */}
        <img
          src={redAvatar}
          alt="Red Stamp"
          className={`${stampStyle} top-[100px] left-10 rotate-[34deg]`}
        />

        {/* Middle: Pink (Tilted Left) */}
        <img
          src={pinkAvatar}
          alt="Pink Stamp"
          className={`${stampStyle} top-[200px] left-0 -rotate-6`}
        />

        {/* Bottom: Yellow (Tilted Right) */}
        <img
          src={yellowAvatar}
          alt="Yellow Stamp"
          className={`${stampStyle} top-[400px] right-[70px] -rotate-[20deg]`}
        />

        {/* Bottom: Blue (Tilted Left) */}
        <img
          src={blueAvatar}
          alt="Blue Stamp"
          className={`${stampStyle} top-[500px] -right-5 rotate-[38deg]`}
        />

        {/* Extra: Red on Right */}
        <img
          src={redAvatar}
          alt="Red Stamp"
          className={`${stampStyle} top-[300px] -right-5 -rotate-[125deg]`}
        />
      </div>




      {/* ===========================================
          MAIN TEXT CONTENT
          ===========================================
      */}


      <div ref={scrollContainerRef} className="scroll-container relative z-20 w-full lg:container lg:mx-auto lg:flex-col lg:gap-12 lg:items-center flex flex-row overflow-x-auto overflow-y-hidden snap-x" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>

        {/* --- Block 1 --- */}
        <div className="flex flex-col items-center min-w-full snap-center px-4 relative">
          {/* First Left Image - positioned at top-left, same as outer wrapper position */}
          <img
            src={firstLeftImage}
            alt="First Left"
            className="absolute -left-[calc(50vw-50%+28px)] top-[8px] md:top-0 lg:hidden w-24 md:w-48 z-50"
          />
          {/* Red Avatar - 150deg anti-clockwise rotation, positioned at bottom-right near dots */}
          <img
            src={redAvatar}
            alt="Red Avatar"
            className="absolute left-[calc(50%+120px)] md:left-[calc(50%+220px)] bottom-0 lg:hidden w-10 md:w-16 rotate-[150deg] z-[100]"
          />

          {/* Mobile Heading */}
          <h2 className={`${headingStyle} md:hidden`}>
            <Trans i18nKey="gameDetails.block1.headingMobile" components={{ br: <br /> }} />
          </h2>
          {/* Tablet Heading */}
          <h2 className={`${headingStyle} hidden md:block lg:hidden`}>
            <Trans i18nKey="gameDetails.block1.headingTablet" components={{ br: <br /> }} />
          </h2>
          {/* Desktop Heading */}
          <h2 className={`${headingStyle} hidden lg:block`}>
            <Trans i18nKey="gameDetails.block1.headingDesktop" components={{ br: <br /> }} />
          </h2>

          {/* Mobile Body */}
          <p className={`${bodyTextStyle} md:hidden`}>
            <Trans i18nKey="gameDetails.block1.bodyMobile" components={{ br: <br /> }} />
          </p>
          {/* Tablet Body */}
          <p className={`${bodyTextStyle} hidden md:block lg:hidden`}>
            <Trans i18nKey="gameDetails.block1.bodyTablet" components={{ br: <br /> }} />
          </p>
          {/* Desktop Body */}
          <p className={`${bodyTextStyle} hidden lg:block`}>
            <Trans i18nKey="gameDetails.block1.bodyDesktop" components={{ br: <br /> }} />
          </p>
        </div>

        {/* --- Block 2 --- */}
        <div className="flex flex-col items-center min-w-full snap-center px-4 relative">
          <img
            src={secondLeftImage}
            alt="Second Left"
            className="absolute left-0 top-2 md:top-20 lg:hidden w-24 md:w-40"
          />
          <img
            src={yellowAvatar}
            alt="Yellow Avatar"
            className="absolute left-4 md:left-8 -bottom-4 lg:hidden w-12 md:w-20 h-16 md:h-24 rotate-[-20.29deg]"
          />

          {/* Mobile Heading */}
          <h2 className={`${headingStyle} md:hidden`}>
            <Trans i18nKey="gameDetails.block2.headingMobile" components={{ br: <br /> }} />
          </h2>
          {/* Tablet Heading */}
          <h2 className={`${headingStyle} hidden md:block lg:hidden`}>
            <Trans i18nKey="gameDetails.block2.headingTablet" components={{ br: <br /> }} />
          </h2>
          {/* Desktop Heading */}
          <h2 className={`${headingStyle} hidden lg:block`}>
            <Trans i18nKey="gameDetails.block2.headingDesktop" components={{ br: <br /> }} />
          </h2>

          {/* Mobile Body */}
          <p className={`${bodyTextStyle} md:hidden`}>
            <Trans i18nKey="gameDetails.block2.bodyMobile" components={{ br: <br /> }} />
          </p>
          {/* Tablet Body */}
          <p className={`${bodyTextStyle} hidden md:block lg:hidden`}>
            <Trans i18nKey="gameDetails.block2.bodyTablet" components={{ br: <br /> }} />
          </p>
          {/* Desktop Body */}
          <p className={`${bodyTextStyle} hidden lg:block`}>
            <Trans i18nKey="gameDetails.block2.bodyDesktop" components={{ br: <br /> }} />
          </p>
        </div>

        {/* --- Block 3 --- */}
        <div className="flex flex-col items-center min-w-full snap-center px-4 relative">
          {/* Green Avatar - top right - mobile only */}
          <img
            src={mobileGreenAvatar}
            alt="Green Avatar"
            className="absolute right-4 md:right-8 top-0 md:top-20 lg:hidden w-16 md:w-28 rotate-[15deg] z-50"
          />
          {/* Pink Avatar - bottom right - mobile only */}
          <img
            src={mobilePinkAvatar}
            alt="Pink Avatar"
            className="absolute right-4 md:right-8 bottom-0 lg:hidden w-16 md:w-28 rotate-[-10deg] z-50"
          />
          {/* Blue Avatar - bottom left - mobile only */}
          <img
            src={mobileBlueAvatar}
            alt="Blue Avatar"
            className="absolute left-4 md:left-8 -bottom-1 lg:hidden w-16 md:w-28 rotate-[10deg] z-50"
          />
          {/* Mobile Heading */}
          <h2 className={`${headingStyle} md:hidden`}>
            <Trans i18nKey="gameDetails.block3.headingMobile" components={{ br: <br /> }} />
          </h2>
          {/* Tablet Heading */}
          <h2 className={`${headingStyle} hidden md:block lg:hidden`}>
            <Trans i18nKey="gameDetails.block3.headingTablet" components={{ br: <br /> }} />
          </h2>
          {/* Desktop Heading */}
          <h2 className={`${headingStyle} hidden lg:block`}>
            <Trans i18nKey="gameDetails.block3.headingDesktop" components={{ br: <br /> }} />
          </h2>

          {/* Mobile Body */}
          <p className={`${bodyTextStyle} md:hidden`}>
            <Trans i18nKey="gameDetails.block3.bodyMobile" components={{ br: <br /> }} />
          </p>
          {/* Tablet Body */}
          <p className={`${bodyTextStyle} hidden md:block lg:hidden`}>
            <Trans i18nKey="gameDetails.block3.bodyTablet" components={{ br: <br /> }} />
          </p>
          {/* Desktop Body */}
          <p className={`${bodyTextStyle} hidden lg:block`}>
            <Trans i18nKey="gameDetails.block3.bodyDesktop" components={{ br: <br /> }} />
          </p>
        </div>

      </div>

      {/* Dots Indicator for Mobile/Tablet */}
      <div className="lg:hidden flex justify-center items-center mt-4 space-x-2 relative">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className={`w-3 h-3 rounded-full ${activeIndex === index ? 'bg-[#1E4A6E]' : 'bg-[#89B8DF]'}`}
          ></div>
        ))}

      </div>

    </div>
  );
};

export default GameFeaturesSection;