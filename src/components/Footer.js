'use client';
import { useRef, useEffect } from 'react';
import { SHOP } from '@/lib/config';
import Link from 'next/link';
import AppIcon from '@/components/AppIcon';
import { useRouter } from 'next/navigation';

export default function Footer() {
  const router = useRouter();
  const clickCount = useRef(0);
  const clickTimer = useRef(null);

  // Secret Owner Access: 3 clicks on copyright footer
  function handleSecretClick() {
    clickCount.current += 1;
    if (clickTimer.current) clearTimeout(clickTimer.current);

    if (clickCount.current >= 3) {
      clickCount.current = 0;
      router.push('/admin');
      return;
    }

    clickTimer.current = setTimeout(() => {
      clickCount.current = 0;
    }, 1500);
  }

  // Keyboard shortcut: Ctrl + Shift + A or Alt + A
  useEffect(() => {
    function handleKeyDown(e) {
      if (
        (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) ||
        (e.altKey && (e.key === 'A' || e.key === 'a'))
      ) {
        e.preventDefault();
        router.push('/admin');
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  return (
    <footer className="footer-master">
      {/* ── Trust Features Strip ── */}
      <div className="footer-trust-strip">
        <div className="footer-trust-item">
          <div className="footer-trust-icon">
            <AppIcon name="package" size={20} />
          </div>
          <div className="footer-trust-text">
            <strong>Fast Local Delivery</strong>
            <small>Direct to your doorstep in Bakani</small>
          </div>
        </div>
        <div className="footer-trust-item">
          <div className="footer-trust-icon">
            <AppIcon name="shield" size={20} />
          </div>
          <div className="footer-trust-text">
            <strong>100% Genuine Products</strong>
            <small>Verified stationery brands</small>
          </div>
        </div>
        <div className="footer-trust-item">
          <div className="footer-trust-icon">
            <AppIcon name="cod" size={20} />
          </div>
          <div className="footer-trust-text">
            <strong>Cash on Delivery & UPI</strong>
            <small>Easy and safe payment</small>
          </div>
        </div>
        <div className="footer-trust-item">
          <div className="footer-trust-icon">
            <AppIcon name="message" size={20} />
          </div>
          <div className="footer-trust-text">
            <strong>Quick WhatsApp Help</strong>
            <small>Direct support from shop owner</small>
          </div>
        </div>
      </div>

      {/* ── Main Footer Grid ── */}
      <div className="footer-grid">
        {/* Brand Column */}
        <div className="footer-brand">
          <div className="footer-brand-header">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Gupta Store Logo"
              className="footer-brand-logo"
            />
            <div>
              <h2 className="footer-brand-title">
                Gupta <span>Store</span>
              </h2>
              <span className="footer-brand-badge">Est. 1990 • Bakani</span>
            </div>
          </div>

          <p className="footer-brand-desc">
            1990 se Bakani ki seva mein. School students, competitive exam aspirants, teachers aur office work ke liye authentic stationery ka vishwasniya pata!
          </p>

          <div className="footer-brand-actions">
            <a
              href={`https://wa.me/${SHOP.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="footer-action-btn whatsapp"
            >
              <AppIcon name="message" size={16} />
              <span>WhatsApp Chat</span>
            </a>
            <a
              href={`tel:+${SHOP.phone}`}
              className="footer-action-btn phone"
            >
              <AppIcon name="phone" size={15} />
              <span>+91 {SHOP.phone.slice(2)}</span>
            </a>
          </div>
        </div>

        {/* Quick Links Column */}
        <div className="footer-col">
          <h3 className="footer-heading">Quick Links</h3>
          <Link href="/" className="footer-link">
            <AppIcon name="home" size={16} />
            <span>Home</span>
          </Link>
          <Link href="/wishlist" className="footer-link">
            <AppIcon name="heart" size={16} />
            <span>Wishlist</span>
          </Link>
          <Link href="/cart" className="footer-link">
            <AppIcon name="cart" size={16} />
            <span>Shopping Cart</span>
          </Link>
          <Link href="/orders" className="footer-link">
            <AppIcon name="package" size={16} />
            <span>My Orders</span>
          </Link>
          <Link href="/track" className="footer-link">
            <AppIcon name="truck" size={16} />
            <span>Track Order</span>
          </Link>
          <Link href="/auth" className="footer-link">
            <AppIcon name="user" size={16} />
            <span>Login / Register</span>
          </Link>
        </div>

        {/* Categories Column */}
        <div className="footer-col">
          <h3 className="footer-heading">Categories</h3>
          <Link href="/?cat=pen" className="footer-link">
            <AppIcon name="fileText" size={16} />
            <span>Pens, Pencils & Inks</span>
          </Link>
          <Link href="/?cat=notebook" className="footer-link">
            <AppIcon name="book" size={16} />
            <span>Registers & Notebooks</span>
          </Link>
          <Link href="/?cat=colors" className="footer-link">
            <AppIcon name="palette" size={16} />
            <span>Art, Craft & Colors</span>
          </Link>
          <Link href="/?cat=bag" className="footer-link">
            <AppIcon name="briefcase" size={16} />
            <span>School Bags & Pouches</span>
          </Link>
          <Link href="/?cat=extra" className="footer-link">
            <AppIcon name="calculator" size={16} />
            <span>Office & Desk Extras</span>
          </Link>
        </div>

        {/* Contact Column */}
        <div className="footer-col">
          <h3 className="footer-heading">Contact & Store</h3>
          <a href={`tel:+${SHOP.phone}`} className="footer-link">
            <AppIcon name="phone" size={16} />
            <span>+91 {SHOP.phone.slice(2)}</span>
          </a>
          <a
            href={`https://wa.me/${SHOP.whatsapp}`}
            target="_blank"
            rel="noreferrer"
            className="footer-link"
          >
            <AppIcon name="message" size={16} />
            <span>WhatsApp Support</span>
          </a>
          <Link href="/about" className="footer-link">
            <AppIcon name="info" size={16} />
            <span>About Our Store</span>
          </Link>
          <Link href="/contact" className="footer-link">
            <AppIcon name="mail" size={16} />
            <span>Contact Us</span>
          </Link>
          <div className="footer-address-box">
            <AppIcon name="mapPin" size={16} className="footer-address-icon" />
            <span>{SHOP.address}</span>
          </div>
        </div>
      </div>

      {/* ── Footer Bottom Copyright & Trust ── */}
      <div className="footer-bottom">
        <span
          onClick={handleSecretClick}
          className="footer-copyright"
          title="Gupta General Store"
        >
          © {new Date().getFullYear()} Gupta General Store • Est. 1990 • Made with ❤️ for Bakani
        </span>
        <div className="footer-bottom-trust">
          <span>
            <AppIcon name="shield" size={15} />
            <span>100% Safe & Trusted Shopping</span>
          </span>
          <span className="footer-trust-divider">•</span>
          <span>
            <AppIcon name="mapPin" size={14} />
            <span>Bakani, Rajasthan</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
