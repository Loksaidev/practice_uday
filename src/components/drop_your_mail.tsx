import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

// Assuming the logo path is relative to the component file
import knowsyLogo from '../assets/knowsy-logo.png';

// Import custom fonts
import slackeyFont from '../assets/fonts/Slackey-Regular.ttf';
import annieFont from '../assets/fonts/AnnieUseYourTelescope-Regular.ttf';

// Import UI components
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';

const NewsletterSection: React.FC = () => {
  const { t } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);

  const [email, setEmail] = useState('');

  // --- Typography Styles ---
  const headingStyle = `
    font-['Slackey']
    text-[35px]
    sm:text-[45px]
    leading-snug
    text-[#2F6452]
    text-center
  `;

  const bodyTextStyle = `
    font-['AnnieUseYourTelescope']
    text-[25px]
    sm:text-[30px]
    leading-[1.3]
    text-black
    text-center
    px-4
    max-w-[1146px]
    mx-auto
  `;

  const inputContainerStyle = `
    w-full
    max-w-[330px]
    sm:max-w-[700px]
    h-[50px]
    sm:h-[70px]
    px-4
    rounded-[50px]
    border-[3px]
    border-[#2F6452]
    bg-[#84D2B8]
    shadow-[0_4px_4px_0_rgba(0,0,0,0.4)]
    flex
    justify-center
    items-center
    mx-auto
    mt-12
  `;

  const inputPlaceholderStyle = `
    font-['AnnieUseYourTelescope']
    text-[25px]
    sm:text-[30px]
    text-[#2F6452]
    text-center
    w-full
    bg-transparent
    placeholder-[#2F6452]
    focus:outline-none
    focus:ring-0
  `;

  return (
    <div className="w-full overflow-hidden">
      <style>
        {`
          @font-face {
            font-family: 'Slackey';
            src: url(${slackeyFont}) format('truetype');
          }
          @font-face {
            font-family: 'AnnieUseYourTelescope';
            src: url(${annieFont}) format('truetype');
          }
        `}
      </style>

      {/* 1. White Background Section (Top)
         This acts as the top background. We give it height so the logo doesn't
         hit the top of the browser window.
      */}
      <div className="w-full bg-white h-24"></div>

      {/* 2. Green Section (Bottom)
         This contains the logo, but we shift the logo UPWARDS to bridge the gap.
      */}
      <div style={{ backgroundColor: '#84D2B8' }} className="w-full pb-20">
        <div className="max-w-6xl mx-auto flex flex-col items-center">

          {/* --- LOGO WITH OVERLAP EFFECT ---
              -translate-y-1/2: Pulls the element up by 50% of its height.
              This places the center of the image exactly on the top edge of the green box.
          */}
          <div className="transform -translate-y-1/2 -mb-10">
             <img src={knowsyLogo} alt="Knowsy Logo" className="w-32 h-auto" />
          </div>

          {/* --- Heading --- */}
          {/* Note: Removed 'Get on the' from heading to match screenshot if needed, or keep as is */}
          <h2 className={headingStyle}>
            {t("newsletter.heading")}
          </h2>

          {/* --- Body Text --- */}
          <p className={`mt-0 ${bodyTextStyle}`}>
            <span className="block md:hidden lg:hidden">{t("newsletter.description")}</span>
            <span className="hidden md:block lg:hidden whitespace-pre-line">{t("newsletter.descriptionTablet")}</span>
            <span className="hidden lg:block">{t("newsletter.description")}</span>
          </p>

          {/* --- Input Field --- */}
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <div className={inputContainerStyle.replace('mt-12', 'mt-6')}>
                <button
                  className={inputPlaceholderStyle}
                  aria-label="Contact support"
                >
                  {t("newsletter.button")}
                </button>
              </div>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enter your contact address</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  type="email"
                />
                <Button onClick={() => { alert(`Email submitted: ${email}`); setEmail(''); setIsOpen(false); }} className="w-full">
                  Submit
                </Button>
              </div>
            </DialogContent>
          </Dialog>

        </div>
      </div>
    </div>
  );
};

export default NewsletterSection;