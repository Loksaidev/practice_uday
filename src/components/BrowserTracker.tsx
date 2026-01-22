import { useBrowserTracking } from '@/hooks/useBrowserTracking';

/**
 * Component that tracks browser specifications on initial website visit
 * This component should be placed at the root level of the app
 */
export function BrowserTracker() {
    useBrowserTracking();
    return null; // This component doesn't render anything
}

export default BrowserTracker;