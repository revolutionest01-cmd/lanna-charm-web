import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ReactGA from 'react-ga4';

let gaInitialized = false;
let gaTrackingEnabled = false;

/**
 * Initialize Google Analytics
 * Call this once at the app root level
 */
export const initializeGA = (enabled = true) => {
  gaTrackingEnabled = enabled;
  if (!enabled) {
    return;
  }

  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  
  if (!measurementId) {
    console.warn(
      'Google Analytics Measurement ID not configured. ' +
      'Please set VITE_GA_MEASUREMENT_ID in your .env file. ' +
      'Get it from: https://analytics.google.com/ > Admin > Data Streams > Web Stream'
    );
    return;
  }

  if (!gaInitialized) {
    ReactGA.initialize(measurementId);
    gaInitialized = true;
    console.log('Google Analytics initialized with ID:', measurementId);
  }
};

/**
 * Hook to track page views when route changes
 * Use this component in your router to automatically track page views
 */
export const useGAPageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    if (!measurementId || !gaTrackingEnabled) return;

    // Send page_view event to Google Analytics
    const path = location.pathname + location.search + location.hash;
    ReactGA.event('page_view', {
      page_path: path,
      page_title: document.title
    });
  }, [location]);
};

/**
 * Track custom events in Google Analytics
 * Usage: trackGAEvent('video_play', { video_title: 'My Video' })
 */
export const trackGAEvent = (eventName: string, eventParams?: Record<string, string | number | boolean>) => {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (!measurementId || !gaTrackingEnabled) return;

  ReactGA.event(eventName, eventParams);
};

/**
 * Set user properties for better analytics
 * Usage: setGAUserProperty('user_type', 'premium_member')
 */
export const setGAUserProperty = (propertyName: string, value: string) => {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (!measurementId || !gaTrackingEnabled) return;

  ReactGA.set({ [propertyName]: value });
};

export default ReactGA;
