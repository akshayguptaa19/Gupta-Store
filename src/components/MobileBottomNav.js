'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCartStore, useAuthStore } from '@/lib/store';
import AppIcon from '@/components/AppIcon';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const items = useCartStore(s => s.items);
  const user = useAuthStore(s => s.user);

  const cartCount = items.reduce((sum, item) => sum + item.qty, 0);

  // Don't show bottom nav inside admin panel
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const navItems = [
    {
      label: 'Home',
      icon: 'home',
      href: '/',
      active: pathname === '/' || pathname === '/home',
    },
    {
      label: 'Categories',
      icon: 'grid',
      href: '/#shopSection',
      active: false,
    },
    {
      label: 'Cart',
      icon: 'cart',
      href: '/cart',
      badge: cartCount,
      active: pathname === '/cart',
    },
    {
      label: 'Orders',
      icon: 'package',
      href: '/orders',
      active: pathname === '/orders',
    },
    {
      label: user ? 'Account' : 'Login',
      icon: user ? 'user' : 'key',
      href: user ? '/profile' : '/auth',
      active: pathname === '/profile' || pathname === '/auth',
    },
  ];

  return (
    <div className="mobile-bottom-nav">
      {navItems.map(item => (
        <Link
          key={item.label}
          href={item.href}
          prefetch={false}
          onClick={(e) => {
            if (item.label === 'Categories' && (pathname === '/' || pathname === '/home')) {
              e.preventDefault();
              document.getElementById('shopSection')?.scrollIntoView({ behavior: 'smooth' });
            } else if (item.active) {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          className={`mobile-nav-item ${item.active ? 'active' : ''}`}
        >
          <div className="mobile-nav-icon-wrap">
            <span className="mobile-nav-icon"><AppIcon name={item.icon} size={18} /></span>
            {item.badge > 0 && (
              <span className="mobile-nav-badge">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </div>
          <span className="mobile-nav-label">{item.label}</span>
        </Link>
      ))}
    </div>
  );
}
