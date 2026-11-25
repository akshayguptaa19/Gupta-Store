'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Ticker from '@/components/Ticker';
import Footer from '@/components/Footer';
import CartFab from '@/components/CartFab';
import Chatbot from '@/components/Chatbot';
import MobileBottomNav from '@/components/MobileBottomNav';
import PwaInstallPrompt from '@/components/PwaInstallPrompt';

export default function AppChrome({ children }) {
  const pathname = usePathname();
  const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/');

  return (
    <>
      {!isAdmin && <Ticker />}
      {!isAdmin && <Navbar />}
      <main className={isAdmin ? '' : 'main-content-wrapper'}>{children}</main>
      {!isAdmin && <Footer />}
      {!isAdmin && <CartFab />}
      {!isAdmin && <Chatbot />}
      {!isAdmin && <MobileBottomNav />}
      {!isAdmin && <PwaInstallPrompt />}
    </>
  );
}