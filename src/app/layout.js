import './globals.css';
import Toast from '@/components/Toast';
import DarkModeInit from '@/components/DarkModeInit';
import AppChrome from '@/components/AppChrome';
import AppSplashScreen from '@/components/AppSplashScreen';

export const metadata = {
  title: 'Gupta General Store – Best Stationery in Bakani',
  description: 'Bakani ka sabse acha stationery store. Pens, notebooks, colors aur 200+ items ghar baithe order karo.',
  keywords: 'stationery, bakani, pens, notebooks, school supplies',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/logo.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Gupta Store',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  minimumScale: 1,
  viewportFit: 'cover',
  themeColor: '#0f172a',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://m.media-amazon.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://m.media-amazon.com" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(function(regs) {
                    for (var r of regs) { r.unregister(); }
                  }).catch(function() {});
                  if (navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
                  }
                }
                if ('caches' in window) {
                  caches.keys().then(function(keys) {
                    for (var k of keys) { caches.delete(k); }
                  }).catch(function() {});
                }
              } catch(e) {}
              // Auto-recover from chunk and client navigation errors transparently
              window.addEventListener('error', function(e) {
                var msg = e && (e.message || (e.error && e.error.message)) || '';
                if (typeof msg === 'string') {
                  if (msg.indexOf('Loading chunk') !== -1 || msg.indexOf('ChunkLoadError') !== -1 || msg.indexOf('dynamically imported module') !== -1 || msg.indexOf('router state') !== -1) {
                    if (!sessionStorage.getItem('ggs_nav_recovery')) {
                      sessionStorage.setItem('ggs_nav_recovery', '1');
                      setTimeout(function() { window.location.reload(); }, 100);
                    }
                  }
                }
              });
              window.addEventListener('unhandledrejection', function(e) {
                var reason = e && (e.reason && (e.reason.message || String(e.reason))) || '';
                if (typeof reason === 'string') {
                  if (reason.indexOf('Loading chunk') !== -1 || reason.indexOf('ChunkLoadError') !== -1 || reason.indexOf('dynamically imported module') !== -1 || reason.indexOf('router state') !== -1 || reason.indexOf('Failed to fetch') !== -1) {
                    e.preventDefault();
                    if (!sessionStorage.getItem('ggs_nav_recovery')) {
                      sessionStorage.setItem('ggs_nav_recovery', '1');
                      setTimeout(function() { window.location.reload(); }, 100);
                    }
                  }
                }
              });
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'LocalBusiness',
              name: 'Gupta General Store',
              image: '/logo.png',
              telephone: '+91 8107615285',
              url: 'https://guptastorebakani.com',
              address: {
                '@type': 'PostalAddress',
                streetAddress: 'Main Market, Bakani',
                addressLocality: 'Bakani, Jhalawar',
                addressRegion: 'Rajasthan',
                postalCode: '326022',
                addressCountry: 'IN',
              },
              openingHoursSpecification: [
                {
                  '@type': 'OpeningHoursSpecification',
                  dayOfWeek: [
                    'Monday',
                    'Tuesday',
                    'Wednesday',
                    'Thursday',
                    'Friday',
                    'Saturday',
                    'Sunday',
                  ],
                  opens: '08:00',
                  closes: '21:00',
                },
              ],
              priceRange: '₹',
            }),
          }}
        />
      </head>
      <body>
        <AppSplashScreen />
        <DarkModeInit />
        <AppChrome>{children}</AppChrome>
        <Toast />
      </body>
    </html>
  );
}
