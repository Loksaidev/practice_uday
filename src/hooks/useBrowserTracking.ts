import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { collectBrowserSpecs } from '@/lib/browserSpecs';

const SESSION_STORAGE_KEY = 'knowsy_session_tracked';

/**
 * Generates a unique session ID for each browser session
 * This ID is unique per session, allowing multiple sessions to be tracked per user
 */
function generateSessionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `session_${timestamp}_${random}`;
}

/**
 * Hook to track browser specifications for each session
 * Uses sessionStorage to ensure we only track once per browser session
 * Each new tab/window opening creates a new session entry
 */
export function useBrowserTracking() {
    const hasTracked = useRef(false);

    useEffect(() => {
        const trackBrowserSpecs = async () => {
            // Check if already tracked this session (prevents duplicate entries within same session)
            if (hasTracked.current || sessionStorage.getItem(SESSION_STORAGE_KEY)) {
                return;
            }

            hasTracked.current = true;

            try {
                const specs = collectBrowserSpecs();
                const sessionId = generateSessionId();

                // Get the current authenticated user (if any)
                const { data: { user } } = await supabase.auth.getUser();

                const trackingData = {
                    // Using session_id concept but stored in visitor_id column
                    visitor_id: sessionId,
                    user_id: user?.id || null,

                    // Browser Info
                    user_agent: specs.userAgent,
                    browser_name: specs.browserName,
                    browser_version: specs.browserVersion,

                    // Device Info
                    platform: specs.platform,
                    device_type: specs.deviceType,
                    is_mobile: specs.isMobile,
                    is_tablet: specs.isTablet,

                    // Screen Info
                    screen_width: specs.screenWidth,
                    screen_height: specs.screenHeight,
                    viewport_width: specs.viewportWidth,
                    viewport_height: specs.viewportHeight,
                    device_pixel_ratio: specs.devicePixelRatio,
                    color_depth: specs.colorDepth,

                    // Connection Info
                    connection_type: specs.connectionType,
                    effective_type: specs.effectiveType,
                    downlink: specs.downlink,

                    // Language & Timezone
                    language: specs.language,
                    languages: specs.languages,
                    timezone: specs.timezone,
                    timezone_offset: specs.timezoneOffset,

                    // Hardware
                    cpu_cores: specs.cpuCores,
                    device_memory: specs.deviceMemory,
                    max_touch_points: specs.maxTouchPoints,

                    // Features
                    cookies_enabled: specs.cookiesEnabled,
                    do_not_track: specs.doNotTrack,
                    is_online: specs.onLine,

                    // Referrer & Page Info
                    referrer: specs.referrer,
                    page_url: specs.pageUrl,
                    page_title: specs.pageTitle,
                };

                // Insert into Supabase
                // Note: Using 'any' type assertion because browser_specs table types
                // need to be regenerated. Run: npx supabase gen types typescript --project-id <your-project-id> > src/integrations/supabase/types.ts
                const { error } = await supabase
                    .from('browser_specs' as any)
                    .insert(trackingData as any);

                if (error) {
                    console.error('Error tracking browser specs:', error);
                    return;
                }

                // Mark as tracked for this session only
                sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
                console.log('Browser session tracked successfully');

            } catch (error) {
                console.error('Error tracking browser specs:', error);
            }
        };

        // Small delay to ensure the page has fully loaded
        const timeoutId = setTimeout(trackBrowserSpecs, 500);

        return () => clearTimeout(timeoutId);
    }, []);
}

export default useBrowserTracking;