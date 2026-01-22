import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// --- Asset Imports ---
import cardHeaderBg from '../assets/card.png';

// --- Font Imports ---
import slackeyFont from '../assets/fonts/Slackey-Regular.ttf';
import annieFont from '../assets/fonts/AnnieUseYourTelescope-Regular.ttf';

const SelectionSection: React.FC = () => {
    const { t } = useTranslation();

    // --- Configuration ---
    const buttonColors = [
        '#89B8DF', // Blue
        '#FCC804', // Yellow
        '#E9A6E5', // Pink
        '#ED908A', // Salmon
        '#84D2B8'  // Green
    ];

    const buttonLabels = [
        t("section.button1"),
        t("section.button2"),
        t("section.button3"),
        t("section.button4"),
        t("section.button5")
    ];

    const buttonUrls = [
        "/store",
        "/qrcode",
        "https://www.luverly.shop/pages/corporate-gifting",
        "/contact-sales",
        "/organizations"
    ];

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
        <div className="w-full pt-4 pb-0 px-4 flex justify-center items-center relative overflow-hidden" style={{ background: 'linear-gradient(to bottom, white 0% 15%, #FCC804 15% 92%, #E9A6E5 92% 100%)' }}>

            <style>{fontStyles}</style>

            {/* --- Main Card Container --- */}
            <div className="w-full max-w-[600px] lg:max-w-[700px] bg-white rounded-3xl md:rounded-[40px] lg:rounded-[48px] overflow-hidden relative z-10">

                {/* HEADER FIX: 
           1. h-[220px]: Sets a fixed, shorter height for the header.
           2. backgroundSize: 'cover': Ensures image fills width without stretching.
           3. backgroundPosition: 'top center': Anchors image to the top.
              (The excess image height is cropped off the bottom).
           4. flex items-center: Centers the text vertically in the new shorter space.
        */}
                <div
                    className="w-full h-[160px] md:h-[220px] lg:h-[260px] relative flex items-center justify-center p-4"
                    style={{
                        backgroundImage: `url(${cardHeaderBg})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'top center',
                        backgroundRepeat: 'no-repeat'
                    }}
                >
                    {/* The Text Overlay */}
                    <h2 className="font-['Slackey'] text-2xl md:text-4xl lg:text-5xl text-black text-center leading-snug drop-shadow-sm -mt-16 md:mt-[2px]">
                        {t("section.title")}
                    </h2>
                </div>

                {/* Body Section (Buttons) */}
                {/* Reduced top padding (pt-6) since header is shorter */}
                <div className="bg-white px-2 md:px-8 lg:px-10 pb-12 lg:pb-14 pt-0 md:pt-6 lg:pt-8 flex flex-col gap-4 lg:gap-5">

                    {buttonLabels.map((label, index) => {
                        const isExternal = buttonUrls[index].startsWith('http');
                        // Use slightly smaller font for button4 (index 3 - Custom Knowsy Physical Boxes)
                        const fontSize = index === 3 ? 'text-lg md:text-2xl lg:text-[2.1rem]' : 'text-lg md:text-2xl lg:text-4xl';
                        const buttonClass = `
              block
              w-full
              py-3 lg:py-4
              px-6 lg:px-8
              rounded-full
              shadow-[0_3px_0_rgba(0,0,0,0.15)] lg:shadow-[0_4px_0_rgba(0,0,0,0.15)]
              hover:shadow-[0_5px_0_rgba(0,0,0,0.15)] lg:hover:shadow-[0_6px_0_rgba(0,0,0,0.15)]
              hover:-translate-y-1
              transition-all
              duration-200
              font-['AnnieUseYourTelescope']
              font-normal
              ${fontSize}
              text-black
              text-center
              leading-tight
              whitespace-nowrap
            `;

                        const textStrokeStyle = {
                            WebkitTextStroke: '0.5px black',
                            textStroke: '0.5px black'
                        };

                        return isExternal ? (
                            <a
                                key={index}
                                href={buttonUrls[index]}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ backgroundColor: buttonColors[index], ...textStrokeStyle }}
                                className={buttonClass}
                            >
                                {label}
                            </a>
                        ) : (
                            <Link
                                key={index}
                                to={buttonUrls[index]}
                                style={{ backgroundColor: buttonColors[index], ...textStrokeStyle }}
                                className={buttonClass}
                            >
                                {label}
                            </Link>
                        );
                    })}

                </div>

            </div>

        </div>
    );
};

export default SelectionSection;
