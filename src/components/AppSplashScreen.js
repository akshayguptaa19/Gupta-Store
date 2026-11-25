'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import AppIcon from '@/components/AppIcon';

export default function AppSplashScreen() {
  const [show, setShow] = useState(false);
  const [fading, setFading] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    try {
      // Check if splash was already shown
      const alreadyShown = localStorage.getItem('ggsSplashShown');
      if (alreadyShown) {
        return;
      }
      setShow(true);

      // Dismiss smoothly
      const fadeTimer = setTimeout(() => {
        setFading(true);
      }, 450);

      const hideTimer = setTimeout(() => {
        setShow(false);
        try { localStorage.setItem('ggsSplashShown', '1'); } catch {}
      }, 750);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    } catch {
      setShow(false);
    }
  }, []);

  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: '#0a0f1d',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: fading ? 0 : 1,
        transform: fading ? 'scale(1.03)' : 'scale(1)',
        transition: 'opacity 350ms cubic-bezier(0.4, 0, 0.2, 1), transform 350ms cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      {/* Ambient background glow */}
      <div
        style={{
          position: 'absolute',
          width: '280px',
          height: '280px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34, 197, 94, 0.18) 0%, transparent 70%)',
          filter: 'blur(30px)',
          pointerEvents: 'none',
        }}
      />

      {/* Animated Logo Container */}
      <div
        style={{
          position: 'relative',
          width: '96px',
          height: '96px',
          borderRadius: '24px',
          padding: '4px',
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.8), rgba(22, 163, 74, 0.3))',
          boxShadow: '0 12px 36px -6px rgba(34, 197, 94, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          animation: 'splashPop 500ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '20px',
            backgroundColor: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {imgError ? (
            <span style={{ fontSize: '38px' }}>🏪</span>
          ) : (
            <img
              src="/logo.png"
              alt="Gupta Store Logo"
              style={{
                width: '82%',
                height: '82%',
                objectFit: 'contain',
              }}
              onError={() => setImgError(true)}
            />
          )}
        </div>
      </div>

      {/* Store Title */}
      <div
        style={{
          fontSize: '22px',
          fontWeight: 800,
          color: '#ffffff',
          letterSpacing: '-0.3px',
          marginBottom: '4px',
          textAlign: 'center',
          animation: 'splashFadeUp 450ms ease-out 100ms both',
        }}
      >
        Gupta General Store
      </div>

      {/* Subtitle */}
      <div
        style={{
          fontSize: '13px',
          color: '#94a3b8',
          marginBottom: '16px',
          textAlign: 'center',
          fontWeight: 500,
          animation: 'splashFadeUp 450ms ease-out 150ms both',
        }}
      >
        Bakani • Stationery &amp; School Samagri
      </div>

      {/* Delivery Badge */}
      <div
        style={{
          fontSize: '11px',
          fontWeight: 700,
          color: '#4ade80',
          backgroundColor: 'rgba(6, 78, 59, 0.6)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          padding: '4px 12px',
          borderRadius: '20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          animation: 'splashFadeUp 450ms ease-out 200ms both',
        }}
      >
        <AppIcon name="truck" size={13} /> Same-Day Local Delivery in Bakani
      </div>

      {/* Smooth Loading Bar */}
      <div
        style={{
          width: '120px',
          height: '3px',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '4px',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: '45%',
            backgroundColor: '#22c55e',
            borderRadius: '4px',
            animation: 'splashProgress 900ms infinite ease-in-out',
          }}
        />
      </div>

      <style jsx global>{`
        @keyframes splashPop {
          0% {
            opacity: 0;
            transform: scale(0.65) translateY(16px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes splashFadeUp {
          0% {
            opacity: 0;
            transform: translateY(8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes splashProgress {
          0% {
            left: -45%;
          }
          100% {
            left: 100%;
          }
        }
      `}</style>
    </div>
  );
}

