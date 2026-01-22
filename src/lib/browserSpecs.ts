/**
 * Browser Specifications Utility
 * Collects detailed browser and device information
 */

export interface BrowserSpecs {
  // Browser Info
  userAgent: string;
  browserName: string;
  browserVersion: string;

  // Device Info
  platform: string;
  deviceType: 'desktop' | 'tablet' | 'mobile';
  isMobile: boolean;
  isTablet: boolean;

  // Screen Info
  screenWidth: number;
  screenHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  devicePixelRatio: number;
  colorDepth: number;

  // Connection Info
  connectionType: string | null;
  effectiveType: string | null;
  downlink: number | null;

  // Language & Timezone
  language: string;
  languages: string[];
  timezone: string;
  timezoneOffset: number;

  // Hardware
  cpuCores: number | null;
  deviceMemory: number | null;
  maxTouchPoints: number;

  // Features
  cookiesEnabled: boolean;
  doNotTrack: boolean;
  onLine: boolean;

  // Referrer
  referrer: string;

  // Page Info
  pageUrl: string;
  pageTitle: string;
}

/**
 * Detects the browser name and version from the user agent string
 */
function detectBrowser(): { name: string; version: string } {
  const ua = navigator.userAgent;
  let browserName = 'Unknown';
  let browserVersion = 'Unknown';

  // Edge (Chromium-based)
  if (ua.includes('Edg/')) {
    browserName = 'Microsoft Edge';
    browserVersion = ua.match(/Edg\/(\d+(\.\d+)*)/)?.[1] || 'Unknown';
  }
  // Chrome
  else if (ua.includes('Chrome/') && !ua.includes('Chromium/')) {
    browserName = 'Chrome';
    browserVersion = ua.match(/Chrome\/(\d+(\.\d+)*)/)?.[1] || 'Unknown';
  }
  // Firefox
  else if (ua.includes('Firefox/')) {
    browserName = 'Firefox';
    browserVersion = ua.match(/Firefox\/(\d+(\.\d+)*)/)?.[1] || 'Unknown';
  }
  // Safari
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) {
    browserName = 'Safari';
    browserVersion = ua.match(/Version\/(\d+(\.\d+)*)/)?.[1] || 'Unknown';
  }
  // Opera
  else if (ua.includes('OPR/') || ua.includes('Opera/')) {
    browserName = 'Opera';
    browserVersion = ua.match(/(?:OPR|Opera)\/(\d+(\.\d+)*)/)?.[1] || 'Unknown';
  }
  // IE
  else if (ua.includes('MSIE') || ua.includes('Trident/')) {
    browserName = 'Internet Explorer';
    browserVersion = ua.match(/(?:MSIE |rv:)(\d+(\.\d+)*)/)?.[1] || 'Unknown';
  }

  return { name: browserName, version: browserVersion };
}

/**
 * Detects the device type based on screen size and user agent
 */
function detectDeviceType(): 'desktop' | 'tablet' | 'mobile' {
  const ua = navigator.userAgent.toLowerCase();
  const width = window.innerWidth;

  // Check for mobile devices
  const mobileKeywords = ['android', 'webos', 'iphone', 'ipod', 'blackberry', 'windows phone'];
  const isMobileUA = mobileKeywords.some(keyword => ua.includes(keyword));

  // Check for tablets
  const isTabletUA = ua.includes('ipad') || (ua.includes('android') && !ua.includes('mobile'));

  if (isTabletUA || (width >= 768 && width <= 1024 && isMobileUA)) {
    return 'tablet';
  }

  if (isMobileUA || width < 768) {
    return 'mobile';
  }

  return 'desktop';
}

/**
 * Gets connection information if available
 */
function getConnectionInfo(): { type: string | null; effectiveType: string | null; downlink: number | null } {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

  if (connection) {
    return {
      type: connection.type || null,
      effectiveType: connection.effectiveType || null,
      downlink: connection.downlink || null,
    };
  }

  return { type: null, effectiveType: null, downlink: null };
}

/**
 * Collects all browser specifications
 */
export function collectBrowserSpecs(): BrowserSpecs {
  const browser = detectBrowser();
  const deviceType = detectDeviceType();
  const connection = getConnectionInfo();

  return {
    // Browser Info
    userAgent: navigator.userAgent,
    browserName: browser.name,
    browserVersion: browser.version,

    // Device Info
    platform: navigator.platform,
    deviceType,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',

    // Screen Info
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio || 1,
    colorDepth: window.screen.colorDepth,

    // Connection Info
    connectionType: connection.type,
    effectiveType: connection.effectiveType,
    downlink: connection.downlink,

    // Language & Timezone
    language: navigator.language,
    languages: [...navigator.languages],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),

    // Hardware
    cpuCores: navigator.hardwareConcurrency || null,
    deviceMemory: (navigator as any).deviceMemory || null,
    maxTouchPoints: navigator.maxTouchPoints || 0,

    // Features
    cookiesEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack === '1',
    onLine: navigator.onLine,

    // Referrer
    referrer: document.referrer || 'direct',

    // Page Info
    pageUrl: window.location.href,
    pageTitle: document.title,
  };
}

/**
 * Generates a unique visitor ID based on browser fingerprint
 * This uses available browser properties to create a semi-unique identifier
 */
export function generateVisitorId(): string {
  const specs = collectBrowserSpecs();
  const data = [
    specs.userAgent,
    specs.screenWidth,
    specs.screenHeight,
    specs.devicePixelRatio,
    specs.timezone,
    specs.language,
    specs.cpuCores,
    specs.colorDepth,
    Date.now(),
    Math.random()
  ].join('|');

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  return `visitor_${Math.abs(hash).toString(36)}_${Date.now().toString(36)}`;
}