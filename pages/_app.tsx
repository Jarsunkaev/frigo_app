// pages/_app.tsx
import React, { useState, useEffect } from 'react';
import { Router } from 'next/router';
import Head from 'next/head';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import type { AppProps } from 'next/app';
import CookieConsent, { Cookies } from "react-cookie-consent";
import dynamic from 'next/dynamic';
import { registerServiceWorker } from '../utils/pwa';
import '../styles/globals.css';

// Dynamically import the PWA installer to avoid SSR issues
const PwaInstaller = dynamic(() => import('../components/PwaInstaller'), {
  ssr: false
});

export default function App({ Component, pageProps }: AppProps) {
  const [showCookieSettings, setShowCookieSettings] = useState(false);
  const [cookiePreferences, setCookiePreferences] = useState({
    necessary: true, // Always true, cannot be disabled
    functional: false,
    analytics: false,
    marketing: false
  });

  useEffect(() => {
    // Register service worker for PWA
    registerServiceWorker();

    // Check for existing consent
    const hasAnalyticsConsent = localStorage.getItem("frigo-analytics-consent") === "true";
    
    if (hasAnalyticsConsent) {
      setCookiePreferences(prev => ({...prev, analytics: true}));
      
      // Only initialize analytics if consent is given
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY as string, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
        person_profiles: 'identified_only',
        loaded: (posthog) => {
          if (process.env.NODE_ENV === 'development') posthog.debug();
        }
      });
    } else {
      // Opt out if no consent
      posthog.opt_out_capturing();
    }

    const handleRouteChange = () => {
      if (hasAnalyticsConsent) {
        posthog?.capture('$pageview');
      }
    };
    
    Router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      Router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, []);

  const handleAcceptAll = () => {
    // Set all cookie preferences to true
    setCookiePreferences({
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true
    });
    
    // Store preferences in localStorage
    localStorage.setItem("frigo-analytics-consent", "true");
    localStorage.setItem("frigo-functional-consent", "true");
    localStorage.setItem("frigo-marketing-consent", "true");
    
    // Initialize analytics
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY as string, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      person_profiles: 'identified_only',
    });
    
    // Capture pageview
    posthog?.capture('$pageview');
  };

  const handleSavePreferences = () => {
    // Save current preferences
    localStorage.setItem("frigo-analytics-consent", cookiePreferences.analytics.toString());
    localStorage.setItem("frigo-functional-consent", cookiePreferences.functional.toString());
    localStorage.setItem("frigo-marketing-consent", cookiePreferences.marketing.toString());
    
    if (cookiePreferences.analytics) {
      // Initialize PostHog if analytics is accepted
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY as string, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
        person_profiles: 'identified_only',
      });
      posthog?.capture('$pageview');
    } else {
      // Opt out if not accepted
      posthog.opt_out_capturing();
    }
    
    setShowCookieSettings(false);
  };

  const handleRejectAll = () => {
    // Set all cookie preferences to false except necessary
    setCookiePreferences({
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false
    });
    
    // Store preferences
    localStorage.setItem("frigo-analytics-consent", "false");
    localStorage.setItem("frigo-functional-consent", "false");
    localStorage.setItem("frigo-marketing-consent", "false");
    
    // Opt out of analytics
    posthog.opt_out_capturing();
    
    setShowCookieSettings(false);
  };

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#F59E0B" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </Head>
      
      <PostHogProvider client={posthog}>
        <Component {...pageProps} />
        <PwaInstaller />
        
        <CookieConsent
          location="bottom"
          buttonText="Accept All"
          cookieName="frigo-gdpr-consent"
          style={{ 
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(8px)",
            boxShadow: "0 -2px 10px rgba(0, 0, 0, 0.1)",
            color: "#4B5563",
            padding: "16px",
            border: "1px solid #E5E7EB",
            zIndex: 9999
          }}
          buttonStyle={{ 
            background: "#F59E0B", 
            color: "white", 
            fontSize: "14px",
            fontWeight: "500",
            borderRadius: "8px",
            padding: "8px 16px"
          }}
          expires={150}
          onAccept={handleAcceptAll}
          enableDeclineButton
          onDecline={handleRejectAll}
          declineButtonText="Reject All"
          declineButtonStyle={{
            background: "transparent",
            border: "1px solid #9CA3AF",
            color: "#4B5563",
            fontSize: "14px",
            fontWeight: "500",
            borderRadius: "8px",
            padding: "8px 16px",
            marginRight: "10px"
          }}
          extraCookieOptions={{ path: '/' }}
          buttonWrapperClasses="flex-col sm:flex-row"
        >
          <div>
            <span style={{ fontSize: "14px" }}>
              We use cookies to enhance your experience, analyze site traffic, and for marketing purposes.{" "}
              <a href="/privacy-policy" style={{ color: "#F59E0B", textDecoration: "underline" }}>Privacy Policy</a>
            </span>
            
            <button 
              onClick={() => setShowCookieSettings(true)}
              style={{
                background: "transparent",
                border: "none",
                color: "#F59E0B",
                fontSize: "14px",
                fontWeight: "500",
                textDecoration: "underline",
                marginLeft: "10px",
                cursor: "pointer"
              }}
            >
              Manage Cookie Preferences
            </button>
            
            {showCookieSettings && (
              <div style={{
                marginTop: "16px",
                padding: "16px",
                backgroundColor: "#FEF3C7",
                borderRadius: "8px"
              }}>
                <h4 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "8px" }}>Cookie Preferences</h4>
                
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "flex", alignItems: "center" }}>
                    <input 
                      type="checkbox" 
                      checked={cookiePreferences.necessary} 
                      disabled={true}
                      style={{ marginRight: "8px" }}
                    />
                    <div>
                      <div style={{ fontWeight: "500" }}>Necessary Cookies</div>
                      <div style={{ fontSize: "12px", color: "#6B7280" }}>
                        Required for the website to function properly
                      </div>
                    </div>
                  </label>
                </div>
                
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "flex", alignItems: "center" }}>
                    <input 
                      type="checkbox" 
                      checked={cookiePreferences.functional} 
                      onChange={(e) => setCookiePreferences(prev => ({...prev, functional: e.target.checked}))}
                      style={{ marginRight: "8px" }}
                    />
                    <div>
                      <div style={{ fontWeight: "500" }}>Functional Cookies</div>
                      <div style={{ fontSize: "12px", color: "#6B7280" }}>
                        Remember your preferences and enhance usability
                      </div>
                    </div>
                  </label>
                </div>
                
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "flex", alignItems: "center" }}>
                    <input 
                      type="checkbox" 
                      checked={cookiePreferences.analytics} 
                      onChange={(e) => setCookiePreferences(prev => ({...prev, analytics: e.target.checked}))}
                      style={{ marginRight: "8px" }}
                    />
                    <div>
                      <div style={{ fontWeight: "500" }}>Analytics Cookies</div>
                      <div style={{ fontSize: "12px", color: "#6B7280" }}>
                        Help us understand how you use our website
                      </div>
                    </div>
                  </label>
                </div>
                
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "flex", alignItems: "center" }}>
                    <input 
                      type="checkbox" 
                      checked={cookiePreferences.marketing} 
                      onChange={(e) => setCookiePreferences(prev => ({...prev, marketing: e.target.checked}))}
                      style={{ marginRight: "8px" }}
                    />
                    <div>
                      <div style={{ fontWeight: "500" }}>Marketing Cookies</div>
                      <div style={{ fontSize: "12px", color: "#6B7280" }}>
                        Used to deliver relevant ads and marketing content
                      </div>
                    </div>
                  </label>
                </div>
                
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                  <button
                    onClick={handleSavePreferences}
                    style={{
                      background: "#F59E0B",
                      color: "white",
                      fontSize: "14px",
                      fontWeight: "500",
                      borderRadius: "8px",
                      padding: "8px 16px",
                      border: "none",
                      cursor: "pointer"
                    }}
                  >
                    Save Preferences
                  </button>
                </div>
              </div>
            )}
          </div>
        </CookieConsent>
      </PostHogProvider>
    </>
  );
}