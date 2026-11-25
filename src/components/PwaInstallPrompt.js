'use client';
import { useState, useEffect } from 'react';
import AppIcon from '@/components/AppIcon';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed app)
    const isStandalone = typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone);
    if (isStandalone) {
      setIsInstalled(true);
    }

    // Unregister any old/broken service workers to prevent navigation crashes
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          reg.unregister().catch(() => {});
        }
      }).catch(() => {});
    }

    // Check iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleIos = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isAppleIos);

    // Check if dismissed recently (within 3 days)
    const dismissedTime = localStorage.getItem('ggsPwaDismissed');
    if (!dismissedTime || Date.now() - Number(dismissedTime) > 3 * 24 * 60 * 60 * 1000) {
      setIsDismissed(false);
    }

    // Capture PWA install prompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Online / Offline tracking
    const updateOnlineStatus = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    setIsOffline(!navigator.onLine);

    // Listen for custom trigger to open install prompt (from menu or banner)
    const handleManualTrigger = () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            setIsInstalled(true);
          }
          setDeferredPrompt(null);
        });
      } else if (isAppleIos) {
        setShowIosGuide(true);
      } else {
        alert('App install karne ke liye browser menu me "Add to Home Screen" ya "Install App" select karein.');
      }
    };
    window.addEventListener('ggsTriggerInstall', handleManualTrigger);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      window.removeEventListener('ggsTriggerInstall', handleManualTrigger);
    };
  }, [deferredPrompt, isIos]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosGuide(true);
    } else {
      alert('Browser menu se "Add to Home screen" select karein.');
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('ggsPwaDismissed', String(Date.now()));
  };

  return (
    <>
      {/* Offline Status Badge */}
      {isOffline && (
        <div className="offline-banner">
          <span>📡 Offline Mode — Caching se store browse ho raha hai</span>
        </div>
      )}

      {/* Floating App Install Banner for Mobile */}
      {!isInstalled && !isDismissed && (isInstallable || isIos) && (
        <div className="pwa-install-banner">
          <div className="pwa-banner-content">
            <div className="pwa-banner-icon">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Gupta Store App" width={38} height={38} />
            </div>
            <div className="pwa-banner-text">
              <strong>Gupta Store App</strong>
              <span>Smooth, Fast & 1-Tap Access</span>
            </div>
          </div>
          <div className="pwa-banner-actions">
            <button className="pwa-install-btn" onClick={handleInstallClick}>
              Install
            </button>
            <button className="pwa-close-btn" onClick={handleDismiss} aria-label="Dismiss">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* iOS Add to Home Screen Modal Guide */}
      {showIosGuide && (
        <div className="modal-overlay" onClick={() => setShowIosGuide(false)}>
          <div className="pwa-ios-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pwa-ios-header">
              <span className="pwa-ios-title">📱 Install on iPhone / iPad</span>
              <button className="pwa-close-btn" onClick={() => setShowIosGuide(false)}>✕</button>
            </div>
            <ol className="pwa-ios-steps">
              <li>Safari browser mein bottom bar me <strong>Share button (⎋)</strong> tap karein.</li>
              <li>Neeche scroll karke <strong>&ldquo;Add to Home Screen&rdquo; (+)</strong> select karein.</li>
              <li>Top right me <strong>&ldquo;Add&rdquo;</strong> tap karein.</li>
            </ol>
            <p className="pwa-ios-footer">Store aapke home screen par ek native app jaisa ban jayega!</p>
            <button className="btn btn-orange" style={{ width: '100%', marginTop: '0.8rem' }} onClick={() => setShowIosGuide(false)}>
              Got it! 👍
            </button>
          </div>
        </div>
      )}
    </>
  );
}
