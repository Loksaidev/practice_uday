import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import circle from '../assets/cta/circle.png';
import discover from '../assets/cta/Discover-knowsy-knows.png';
import leftArrow from '../assets/cta/left-arrow.png';

// --- Asset URLs ---
const ASSETS = {
  // Light cyan/blue orb background
  circle: circle,
  // Gradient background for the primary button
  discover: discover,
  // Logo placeholder
  leftArrow: leftArrow,
};

// --- Helper Functions for Responsive Styles (to handle complex absolute positioning) ---

/**
 * Utility function to generate the media query strings for the Orb component's style prop.
 * This is necessary because we are mixing Tailwind (className) and absolute, pixel-based
 * positioning (style).
 * @param {string} minWidth - The minimum width for the media query (e.g., '640px', '768px').
 * @param {string} top - The 'top' CSS value.
 * @param {string} left - The 'left' CSS value.
 * @param {string} width - The 'width' CSS value.
 * @param {string} height - The 'height' CSS value.
 * @returns {string} The CSS string for the media query.
 */
const createMediaQuery = (minWidth, top, left, width, height) => (
  `@media (min-width: ${minWidth}) { top: ${top}; left: ${left}; width: ${width}; height: ${height}; }`
);


// --- Components ---

// A simple component to display the circle images (orbs).
const Orb = ({ className, customStyles }) => (
  <div
    className={`absolute rounded-full opacity-100 pointer-events-none ${className}`}
    style={{
      backgroundImage: `url(${ASSETS.circle})`,
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      ...customStyles, // Merges the custom style object (media queries won't work in inline styles)
    }}
  ></div>
);

// Knowsy Logo using left-arrow.png placeholder
const KnowsyLogo = () => (
  <img
    src={ASSETS.leftArrow}
    alt="Knowsy Logo"
    // Merged sizing: w-[80px] h-[80px] default, increases on md/lg
    className="w-[100px] h-[100px] md:w-[140px] md:h-[140px] lg:w-[140px] lg:h-[140px] rounded-xl shadow-2xl transition duration-300"
  />
);

const CTA = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleDiscoverClick = () => {
    navigate('/organizations');
  };

  const handleContactClick = () => {
    navigate('/contact-sales');
  };

  // Custom CSS class for the 'Contact Sales' button's blur effect
  const backdropBlurClass = 'backdrop-filter backdrop-blur-[20px]';

  // --- Orb Styles Configuration ---

  // 1. Orb 1 (Left/Top side): Merged positioning logic
  const orb1Styles = {
    // Base/Mobile (under sm)
    top: '100px',
    left: '-60px',
    width: '140px',
    height: '140px',
    // Tablet (sm and up) - using desktop code values for sm and md for simplicity and larger size
    [createMediaQuery('640px', '200px', '-140px', '450px', '450px')]: true,
    // Increase size for tablet (md: 768px)
    [createMediaQuery('768px', '200px', '-140px', '550px', '550px')]: true,
    // Tablet from original tablet code: '@media (min-width: 640px)': { top: '200px', left: '-50px', width: '300px', height: '300px' },
    // Desktop (lg and up) - using desktop code values
    [createMediaQuery('1024px', '450px', '-180px', '480px', '480px')]: true,
  };

  // 2. Orb 2 (Right side): Desktop only
  const orb2Styles = {
    top: '150px',
    left: 'calc(100% - 90px)',
    width: '180px',
    height: '180px'
  };

  // 3. Orb 3 (Bottom): Separate responsive breakpoints
  const orb3Styles = {
    // Base/Mobile (under sm) position/size (Bottom Right-ish)
    top: '740px',
    left: '70%',
    width: '120px',
    height: '120px',
    // Tablet (md/768px and up)
    [createMediaQuery('768px', '590px', '70%', '550px', '550px')]: true,
    // Desktop (lg/1024px and up)
    [createMediaQuery('1024px', '600px', 'calc(50% + 300px)', '180px', '180px')]: true,
  };

  // 4. Orb 4 (Left side): Desktop only
  const orb4Styles = {
    top: '150px',
    left: '-40px',
    width: '180px',
    height: '180px'
  };

  // 5. Orb 5 (Right side below): Desktop only
  const orb5Styles = {
    top: '600px',
    left: 'calc(50% + 300px)',
    width: '180px',
    height: '180px'
  };

  // NOTE: If you wanted the Tablet-specific bottom-left position:
  /*
  const orb3TabletLeftStyles = {
    // Base/Mobile (under sm)
    top: '650px',
    left: 'calc(50% - 300px)',
    width: '150px',
    height: '150px',
    // Small (sm)
    [createMediaQuery('640px', '650px', 'calc(50% - 315.5px)', '150px', '150px')]: true,
    // Tablet (md)
    [createMediaQuery('768px', '620px', 'calc(50% - 393px)', '218px', '218px')]: true,
    // Desktop (lg and up)
    [createMediaQuery('1024px', '590px', 'calc(50% - 393px)', '218px', '218px')]: true,
  };
  */

  return (
    <section
      id="cta"
      className="relative min-h-[800px] w-full bg-white flex flex-col items-center justify-center p-4 font-sans"
      style={{ overflow: 'hidden' }}
    >

      {/* --- Circle Background Orbs --- */}

      {/* Orb 1 - Left/Top side (Using the unified styles) */}
      <Orb
        className="transform -rotate-[42.26deg] lg:hidden"
        customStyles={orb1Styles}
      />

      {/* Orb 2 - Right side (Desktop only) */}
      <Orb
        className="hidden lg:block transform -rotate-[103.67deg]"
        customStyles={orb2Styles}
      />

      {/* Orb 3 - Bottom Right (Using the unified/simpler bottom-right styles) */}
      <Orb
        className="transform -rotate-[42.26deg] lg:hidden"
        customStyles={orb3Styles}
      />

      {/* Orb 4 - Left side (Desktop only) */}
      <Orb
        className="hidden lg:block transform -rotate-[103.67deg]"
        customStyles={orb4Styles}
      />

      {/* Orb 5 - Right side below (Desktop only) */}
      <Orb
        className="hidden lg:block transform -rotate-[103.67deg]"
        customStyles={orb5Styles}
      />

      {/* Content Container (z-10 to stay above the orbs) */}
      <div className="z-10 flex flex-col items-center max-w-7xl px-4 py-16">

        <KnowsyLogo />

        {/* Knowsy Knows Title */}
        <h1
          className="text-black text-center font-normal
                      text-3xl lg:text-4xl
                      -mt-4 sm:mt-0"
          style={{
            letterSpacing: '-0.05em',
            lineHeight: '100px',
            fontFamily: 'Avenir Heavy, sans-serif',
          }}
        >
          {t("cta.title")}
        </h1>

        {/* For Organizations Subtitle */}
        <p
          className="text-[#525151] text-center font-light
                      -mt-6 sm:-mt-4
                      text-xl md:text-3xl lg:text-3xl"
          style={{
            letterSpacing: '-0.06em',
            lineHeight: '25px',
            fontFamily: 'Avenir, sans-serif',
          }}
        >
          {t("cta.subtitle")}
        </p>

        {/* Body Text */}
        <div
          className="text-black text-center font-normal mt-10
                      max-w-[1035px] mx-auto
                      text-2xl md:text-3xl lg:text-3xl"
          style={{
            letterSpacing: '-0.06em',
            lineHeight: '120%',
            fontFamily: 'Avenir, sans-serif',
          }}
        >
          {/* Mobile Layout */}
          <p className="md:hidden">
            Build your own custom<br />
            Knowsy to understand your<br />
            teams, customers, or<br />
            community like never<br />
            before. Learn what they<br />
            like, where to sell, who to<br />
            market to, and how to build<br />
            deeper, more positive<br />
            relationships, all with real<br />
            insights and clear analytics.
          </p>

          {/* Tablet Layout */}
          <p className="hidden md:block lg:hidden">
            Build your own custom Knowsy to<br />
            understand your teams, customers, or<br />
            community like never before.<br />
            Learn what they like, where to sell, who<br />
            to market to, and how to build deeper,<br />
            more positive relationships, all with real<br />
            insights and clear analytics.
          </p>

          {/* Desktop Layout */}
          <p className="hidden lg:block" style={{ whiteSpace: 'pre-line' }}>
            {t("cta.bodyDesktop")}
          </p>
        </div>

        {/* CTA Buttons - This section is the most significantly merged/simplified */}
        <div className="flex flex-col lg:flex-row items-center justify-center space-y-6 lg:space-y-0 lg:space-x-8 mt-16 md:mt-24">

          {/* 1. Discover Knowsy Knows Button */}
          <button
            onClick={handleDiscoverClick}
            className="group flex items-center justify-center p-4 rounded-[40px] shadow-xl transition duration-300 transform hover:scale-[1.03]
                        w-[300px] h-[50px] sm:w-[368px] sm:h-[64px] lg:w-[368px] lg:h-[64px]"
            style={{
              backgroundImage: `url(${ASSETS.discover})`,
              backgroundSize: 'cover',
              backgroundRepeat: 'no-repeat',
            }}
          >
            <span
              className="text-black font-light text-center
                          text-2xl sm:text-3xl"
              style={{
                letterSpacing: '-0.06em',
                lineHeight: '25px',
                fontFamily: 'Avenir, sans-serif',
              }}
            >
              {t("cta.discoverButton")}
            </span>
          </button>

          {/* 2. Contact Sales Button */}
          <div
            className={`
              rounded-[42px]
              border-[3px]
              border-white
              shadow-lg
              transition duration-300 transform hover:scale-[1.03]
              w-[300px] h-[50px] sm:w-[368px] sm:h-[64px] lg:w-[331px] lg:h-[65px]
              ${backdropBlurClass}
            `}
            onClick={handleContactClick}
            style={{
              backgroundColor: 'rgba(179, 179, 179, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <span
              className="text-black font-light text-center text-2xl sm:text-3xl"
              style={{
                letterSpacing: '-0.06em',
                lineHeight: '25px',
                fontFamily: 'Avenir, sans-serif',
              }}
            >
              {t("contactSales.title")}
            </span>
          </div>
        </div>

      </div>
    </section>
  );
};

export default CTA;
