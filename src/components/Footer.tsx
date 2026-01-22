 import  { useState } from 'react';
import { useIsMobile } from '../hooks/use-mobile';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
// --- IMPORT ASSETS ---
import KnowsyText from '../assets/images/logo/Logo.svg';     // Knowsy Title
import KnowsyLogo from '../assets/knowsy-logo.png';         // Knowsy Logo (K)
// Social Media Icons
import InstagramIcon from '../assets/footer/social_media/Instagram.png';
import LinkedInIcon from '../assets/footer/social_media/Linkedin.png';
import YoutubeIcon from '../assets/footer/social_media/Youtube.png';
// Avatars (Stamps)
import AvatarBlue from '../assets/footer/avatars/blue.png';
import AvatarGreen from '../assets/footer/avatars/green.png';
import AvatarPink from '../assets/footer/avatars/pink.png';
import AvatarRed from '../assets/footer/avatars/red.png';
import AvatarYellow from '../assets/footer/avatars/yellow.png';
// Define the custom Avenir Next font class
const FONT_STYLE = 'font-avenir font-normal text-[20px] leading-[40px] tracking-[-6%] leading-trim-none text-[#7C7C7C]';
// Reusable Avatar Component (MODIFIED to use image src)
const AvatarDecoration = ({ src, className, rotation }) => (
  <img
    src={src}
    alt="Knowsy Avatar Decoration"
    className={`absolute object-contain opacity-70 ${className}`}
    style={{ transform: `rotate(${rotation})` }}
  />
);
// Reusable Social Icon Component (MODIFIED to use image src)
const SocialIcon = ({ iconSrc, bgColor, altText, link = '#', isMobile }) => (
  <a
    href={link}
    target="_blank"
    rel="noopener noreferrer"
    className={`${isMobile ? 'w-[32px] h-[32px]' : 'w-[50px] h-[50px]'} rounded-full flex items-center justify-center ${bgColor} mx-1 transition-transform hover:scale-110`}
  >
    <img src={iconSrc} alt={altText} className="w-1/2 h-1/2 object-contain" />
  </a>
);
// Mock data for the links
const Footer = () => {
  const isMobile = useIsMobile();
  const { t } = useTranslation();

  const menuLinks = [
    { text: t('footer.startPlaying'), href: '/play' },
    { text: t('footer.buyBoardGame'), href: '/store' },
    { text: t('footer.extendGameplay'), href: '/qrcode' },
    { text: t('footer.customGame'), href: '/contact-sales' },
    { text: t('footer.discoverKnowsy'), href: '#cta' },
  ];
  const helpLinks = [
    { text: t('footer.howToPlay'), href: '/how-to-play' },
    { text: t('footer.contactSales'), href: '/contact-sales' },
    { text: t('footer.joinNewsletter'), href: '/' },
    { text: t('footer.faq'), href: '/' },
    { text: t('footer.shipping'), href: '/' },
  ];
  return (
    <footer className="w-full bg-white relative overflow-hidden py-4 md:pt-2 md:pb-60 lg:py-6 xl:mx-auto font-avenir">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 xl:px-20">
        {/* Mobile Avatars (Decorative Stamps) - UPDATED to use image src */}
        <div className="md:hidden">
          {/* Top Left - Green Stamp */}
          <AvatarDecoration
            src={AvatarGreen}
            className="w-[39px] h-[40px] top-[70px] left-[-11px]"
            rotation="23.02deg"
          />
          {/* Top Left - Pink Stamp */}
          <AvatarDecoration
            src={AvatarPink}
            className="w-[38px] h-[35px] top-[120px] left-[-2px]"
            rotation="-24.6deg"
          />
          {/* Top Right - Blue Stamp */}
          <AvatarDecoration
            src={AvatarBlue}
            className="w-[43px] h-[65px] top-[100px] right-[10px]"
            rotation="37.77deg"
          />
          {/* Top Right - Yellow Stamp */}
          <AvatarDecoration
            src={AvatarYellow}
            className="w-[45px] h-[61px] top-[160px] right-[-20px]"
            rotation="-20.29deg"
          />
          {/* Middle Right - Red Stamp */}
          <AvatarDecoration
            src={AvatarRed}
            className="w-[44px] h-[46px] top-[380px] right-[-5px]"
            rotation="-124.99deg"
          />
          {/* Middle Right - Yellow Stamp (lower) */}
          <AvatarDecoration
            src={AvatarYellow}
            className="w-[44.33px] h-[59.98px] top-[410px] right-[30px]"
            rotation="-20.29deg"
          />
          {/* Bottom Right - Green Stamp */}
          <AvatarDecoration
            src={AvatarGreen}
            className="w-[42px] h-[43px] top-[440px] right-[-4px]"
            rotation="23.02deg"
          />
          {/* Bottom Left - Red Stamp */}
          <AvatarDecoration
            src={AvatarRed}
            className="w-[44px] h-[47px] top-[490px] left-[-10px]"
            rotation="-124.99deg"
          />
        </div>
        {/* Tablet Avatars (md breakpoint) - UPDATED to use image src */}
        <div className="hidden md:block lg:hidden">
          {/* Top Left - Pink Stamp */}
          <AvatarDecoration
            src={AvatarGreen}
            className="w-[84.06px] h-[84.83px] top-[170px] left-[-10px]"
            rotation="23.02deg"
          />
          {/* Top Left Lower - Green Stamp */}
          <AvatarDecoration
            src={AvatarPink}
            className="w-[81.45px] h-[74.6px] top-[270px] left-20px]"
            rotation="-24.6deg"
          />
          {/* Top Right - Blue Stamp */}
          <AvatarDecoration
            src={AvatarBlue}
            className="w-[88.83px] h-[121.46px] top-[210px] right-[60px]"
            rotation="37.77deg"
          />
          {/* Top Right Lower - Yellow Stamp */}
          <AvatarDecoration
            src={AvatarYellow}
            className="w-[97.39px] h-[131.77px] top-[310px] right-[-50px]"
            rotation="-20.29deg"
          />
          {/* Middle Right - Red Stamp */}
          <AvatarDecoration
            src={AvatarRed}
            className="w-[91.89px] h-[97.89px] top-[570px] right-[-30px]"
            rotation="-124.99deg"
          />
          {/* Middle Right Lower - Yellow Stamp */}
          <AvatarDecoration
            src={AvatarYellow}
            className="w-[95.94px] h-[128.8px] top-[620px] right-[50px]"
            rotation="-20.29deg"
          />
          {/* Bottom Right - Green Stamp */}
          <AvatarDecoration
            src={AvatarGreen}
            className="w-[90.3px] h-[91.13px] top-[680px] right-[-20px]"
            rotation="23.02deg"
          />
          {/* Bottom Left - Red Stamp */}
          <AvatarDecoration
            src={AvatarRed}
            className="w-[94.71px] h-[101.22px] top-[640px] left-[-2px]"
            rotation="-124.99deg"
          />
        </div>
        {/* Desktop Avatars - UPDATED to use image src */}
        <div className="hidden lg:block">
          <AvatarDecoration
            src={AvatarGreen}
            className="w-[117.97px] h-[119.05px] top-[50px] right-[150px]"
            rotation="23.02deg"
          />
          <AvatarDecoration
            src={AvatarRed}
            className="w-[115.69px] h-[123.64px] top-[70px] right-[-27px]"
            rotation="-124.99deg"
          />
          <AvatarDecoration
            src={AvatarYellow}
            className="w-[121px] h-[163.94px] top-[160px] right-[70px]"
            rotation="-20.29deg"
          />
          <AvatarDecoration
            src={AvatarPink}
            className="w-[115px] h-[105.44px] top-[290px] right-[170px]"
            rotation="-24.6deg"
          />
          <AvatarDecoration
            src={AvatarBlue}
            className="w-[111px] h-[151px] top-[250px] right-[-30px]"
            rotation="37.77deg"
          />
        </div>
        {/* Knowsy Text Logo - Mobile/Tablet Top Center - UPDATED to use image src */}
        <div className="flex justify-center mt-6 mb-10 md:hidden">
          <img src={KnowsyText} alt="KNOWSY" className="w-36 h-auto" />
        </div>
        {/* Knowsy Text Logo - Tablet (Centered) - UPDATED to use image src */}
        <div className="hidden md:flex lg:hidden justify-center mt-20 mb-32">
            <img src={KnowsyText} alt="KNOWSY" className="w-72 h-auto" />
        </div>
        {/* Knowsy Text Logo - Desktop - UPDATED to use image src */}
        <div className="hidden lg:flex justify-center mb-10 xl:mb-16">
          <img src={KnowsyText} alt="KNOWSY" className="w-[200px] h-auto " />
        </div>
        {/* --- Main Content Grid (Mobile Layout) --- */}
        <div className="grid grid-cols-1 gap-5 md:hidden">
          {/* Menu Links */}
          <div className="col-span-1">
            <ul className={`space-y-3 text-lg pl-8 mb-4  ${FONT_STYLE}`}>
              {menuLinks.map((link) => (
                <li key={link.text}>
                  <Link to={link.href} className="hover:text-black transition-colors duration-300">
                    {link.text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {/* Separator for mobile */}
          <hr className="border-t border-[#797878] mx-4" />
          {/* Help Links */}
          <div className="col-span-1">
            <ul className={`space-y-3 text-lg pl-8 mt-4  ${FONT_STYLE}`}>
              {helpLinks.map((link) => (
                <li key={link.text}>
                  <Link to={link.href} className="hover:text-black transition-colors duration-300">
                    {link.text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {/* --- Main Content Grid (Tablet Layout - Centered with Mobile Visibility) --- */}
        <div className="hidden md:block lg:hidden">
          <div className="flex flex-col items-center max-w-[500px] mx-auto">
            <div className="grid grid-cols-1 gap-4 w-full">
              {/* Menu Links */}
              <div className="col-span-1">
                <ul className={`space-y-3 text-lg mb-4 ${FONT_STYLE}`}>
                  {menuLinks.map((link) => (
                    <li key={link.text}>
                      <Link to={link.href} className="hover:text-black transition-colors duration-300">
                        {link.text}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Separator for tablet */}
              <hr className="border-t border-[#797878]" />
              {/* Help Links */}
              <div className="col-span-1">
                <ul className={`space-y-3 text-lg mt-4 ${FONT_STYLE}`}>
                  {helpLinks.map((link) => (
                    <li key={link.text}>
                      <Link to={link.href} className="hover:text-black transition-colors duration-300">
                        {link.text}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        {/* --- Main Content Grid (Desktop Layout) --- */}
        <div className="hidden lg:grid lg:grid-cols-4 lg:gap-x-24">
          {/* 1. Logo Section (Desktop Left) - UPDATED to use image src */}
          <div className="lg:col-span-1 flex items-center justify-center lg:ml-[-100px]">
            <img
              src={KnowsyLogo}
              alt="Knowsy K Logo"
              className="h-[250px] w-[350px] max-w-none object-contain"
            />
          </div>
          {/* 2. Menu Links */}
          <div className="col-span-1 lg:-ml-8">
            <ul className={`space-y-4 text-xl ${FONT_STYLE}`}>
              {menuLinks.map((link) => (
                <li key={link.text}>
                  <Link to={link.href} className="hover:text-black transition-colors duration-300 whitespace-nowrap">
                    {link.text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {/* 3. Help Links */}
          <div className="col-span-1 lg:ml-80 flex flex-col items-end">
            <ul className={`space-y-4 text-xl ${FONT_STYLE}`}>
              {helpLinks.map((link) => (
                <li key={link.text}>
                  <Link to={link.href} className="hover:text-black transition-colors duration-300 whitespace-nowrap">
                    {link.text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {/* Placeholder for the 4th column */}
          <div className="col-span-1"></div>

        </div>
        {/* Social Icons and Email - UPDATED to use image src */}
        <div className="flex flex-row justify-start md:justify-center lg:justify-center items-center mt-4 md:mt-4 lg:mt-10 gap-4 md:gap-20">          {/* Social Icons */}
          <div className={`flex ${isMobile ? 'ml-4 mt-2' : 'md:mr-8'}`}>
            <SocialIcon
              iconSrc={InstagramIcon}
              bgColor="bg-[#E9A6E5]"
              altText="Instagram"
              link="https://www.instagram.com/knowsy.game"
              isMobile={isMobile}
            />
            <SocialIcon
              iconSrc={LinkedInIcon}
              bgColor="bg-[#89B8DF]"
              altText="LinkedIn"
              link="https://www.linkedin.com/company/knowsy-game/"
              isMobile={isMobile}
            />
            <SocialIcon
              iconSrc={YoutubeIcon}
              bgColor="bg-[#ED908A]"
              altText="YouTube"
              link="https://www.youtube.com/channel/UC6kccwsEARtKxQpWJWZbf-A"
              isMobile={isMobile}
            />
          </div>
          {/* Email */}
          <div className="md:flex lg:absolute lg:right-[13%] xl:right-[11%] lg:top-[160px] xl:top-[490px] pr-4 sm:pr-0 md:pr-0 lg:pr-0 xl:pr-0">
            <p className={`text-sm md:text-base text-right lg:text-right font-normal leading-tight ${FONT_STYLE}`}>
              {t('footer.questionsEmail')}<br className="block md:hidden" /><br className="hidden md:block lg:hidden" />
              <a href="mailto:support.knowsy@luverly.shop" className="font-normal text-black hover:text-black ">
                support.knowsy@luverly.shop
              </a>
            </p>
          </div>
        </div>
        {/* --- Separator Line --- */}
        <div className="md:hidden lg:hidden">
          <hr className="mt-6 mb-4 border-t border-[#797878] mx-4" />
        </div>
        <div className="hidden md:block lg:hidden">
          <div className="max-w-lg mx-auto">
            <hr className="mt-8 mb-4 border-t border-[#797878]" />
          </div>
        </div>
        <div className="hidden lg:block">
          <hr className="mt-6 mb-12 border-t border-[#797878] w-[80vw] relative left-1/2 -translate-x-1/2" />
        </div>
        {/* --- Copyright and Legal Links --- */}
        <div className={`flex flex-col md:flex-row justify-between items-start md:items-center text-sm md:text-lg lg:text-xl px-6 md:px-10 lg:mt-2 lg:mb-4 ${FONT_STYLE}`}>
          {/* Copyright */}
          <div className="flex items-center mt-4 md:mt-0 mb-4 md:mb-0 md:ml-16">
            <span>{t('footer.copyright')}</span>
          </div>
          {/* Legal Links - Hidden on Tablet */}
          <div className="flex flex-row space-x-24 lg:space-x-10 md:hidden lg:flex mt-4 md:mt-0">
            <Link
              to="/privacy-policy"
              className="hover:text-black transition-colors duration-300 cursor-pointer"
            >
              {t('footer.privacyPolicy')}
            </Link>
            <Link
              to="/terms-of-service"
              className="hover:text-black transition-colors duration-300 cursor-pointer ml-auto"
            >
              {t('footer.termsOfService')}
            </Link>
          </div>
        </div>
        {/* Tablet-specific Legal Links under Copyright */}
        <div className="hidden md:block lg:hidden max-w-md mx-auto mt-2">
          <div className="flex flex-row justify-start space-x-60 mt-4 md:mt-10">
            <Link
              to="/privacy-policy"
              className={`hover:text-black transition-colors duration-300 cursor-pointer ${FONT_STYLE}`}
            >
              {t('footer.privacyPolicy')}
            </Link>
            <Link
              to="/terms-of-service"
              className={`hover:text-black transition-colors duration-300 cursor-pointer ${FONT_STYLE}`}
            >
              {t('footer.termsOfService')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
