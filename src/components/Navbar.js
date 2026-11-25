'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useCartStore, useWishlistStore, useAuthStore, useUIStore } from '@/lib/store';
import { getMergedProducts, SYNONYMS } from '@/lib/products';
import { scoreProduct, highlightText, formatDate } from '@/lib/utils';
import AppIcon from '@/components/AppIcon';

export default function Navbar() {
  const router   = useRouter();
  const pathname = usePathname();
  const items    = useCartStore(s => s.items);
  const wishIds  = useWishlistStore(s => s.ids);
  const user     = useAuthStore(s => s.user);
  const logout   = useAuthStore(s => s.logout);
  const darkMode = useUIStore(s => s.darkMode);
  const toggleDark = useUIStore(s => s.toggleDark);

  const cartCount = items.reduce((a, i) => a + i.qty, 0);

  const [query, setQuery]   = useState('');
  const [results, setResults] = useState([]);
  const [ddOpen, setDdOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [mobOpen, setMobOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [seenNotifications, setSeenNotifications] = useState([]);
  const searchRef = useRef(null);
  const notificationRef = useRef(null);
  const products  = useRef([]);

  useEffect(() => {
    try { setSeenNotifications(JSON.parse(localStorage.getItem('ggsSeenNotifications') || '[]')); } catch { setSeenNotifications([]); }
  }, []);

  useEffect(() => {
    if (!user?.phone && !user?.email) {
      setNotifications([]);
      return undefined;
    }

    let active = true;
    async function loadNotifications() {
      try {
        const params = new URLSearchParams();
        if (user.phone) params.set('phone', user.phone);
        if (user.email) params.set('email', user.email);

        const [ordersRes, contactRes] = await Promise.allSettled([
          fetch(`/api/orders?${params.toString()}`),
          fetch(`/api/contact?${params.toString()}`)
        ]);

        const combined = [];

        // 1. Process Orders
        if (ordersRes.status === 'fulfilled') {
          const data = await ordersRes.value.json().catch(() => ({}));
          if (data?.ok && Array.isArray(data.orders)) {
            const statusCopy = {
              placed: ['🎉', 'Order confirmed'],
              confirmed: ['🎉', 'Order confirmed'],
              packed: ['📦', 'Your order is being prepared'],
              shipped: ['🚚', 'Your order is on the way'],
              out_for_delivery: ['🚚', 'Your order is out for delivery'],
              delivered: ['✓', 'Order delivered'],
              cancelled: ['×', 'Order cancelled'],
            };
            const orderNotifs = data.orders.slice(0, 8).map(order => {
              const [icon, title] = statusCopy[order.status] || ['📦', 'Order update'];
              return {
                id: `${order.orderId}:${order.status}:${order.updatedAt || order.createdAt}`,
                orderId: order.orderId,
                type: 'order',
                icon,
                title,
                time: order.updatedAt || order.createdAt,
                status: order.status
              };
            });
            combined.push(...orderNotifs);
          }
        }

        // 2. Process Contact Replies from Store Admin
        if (contactRes.status === 'fulfilled') {
          const cData = await contactRes.value.json().catch(() => ({}));
          if (cData?.ok && Array.isArray(cData.inquiries)) {
            const repliedInqs = cData.inquiries.filter(i => i.reply);
            const inquiryNotifs = repliedInqs.map(inq => ({
              id: `inq-reply:${inq.id || inq._id}:${inq.repliedAt || inq.updatedAt || 'v1'}`,
              inquiryId: inq.id || inq._id,
              type: 'inquiry_reply',
              icon: '💬',
              title: `Gupta Store Reply: ${inq.subject || 'Inquiry'}`,
              subtitle: inq.reply,
              customerMsg: inq.message,
              time: inq.repliedAt || inq.updatedAt || inq.createdAt,
              status: 'replied'
            }));
            combined.push(...inquiryNotifs);
          }
        }

        if (!active) return;
        // Sort descending by time
        combined.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));
        setNotifications(combined.slice(0, 10));
      } catch { /* Navbar should stay usable if services are temporarily unavailable. */ }
    }
    loadNotifications();
    const timer = setInterval(loadNotifications, 30000);
    window.addEventListener('ggsOrderPlaced', loadNotifications);
    window.addEventListener('ggsNotificationsRefresh', loadNotifications);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener('ggsOrderPlaced', loadNotifications);
      window.removeEventListener('ggsNotificationsRefresh', loadNotifications);
    };
  }, [user?.phone, user?.email]);

  const unreadNotifications = notifications.filter(notification => !seenNotifications.includes(notification.id));

  function markNotificationsRead() {
    const ids = notifications.map(notification => notification.id);
    setSeenNotifications(ids);
    localStorage.setItem('ggsSeenNotifications', JSON.stringify(ids));
  }

  useEffect(() => {
    products.current = getMergedProducts();
    const h = JSON.parse(localStorage.getItem('ggsSearchHistory') || '[]');
    setHistory(h);

    function onProductsUpdated(e) {
      if (Array.isArray(e.detail)) {
        products.current = e.detail;
      }
    }
    window.addEventListener('ggsProductsUpdated', onProductsUpdated);
    return () => window.removeEventListener('ggsProductsUpdated', onProductsUpdated);
  }, []);

  function handleSearch(q) {
    setQuery(q);
    if (!q.trim()) { setResults([]); setDdOpen(history.length > 0); return; }
    const scored = products.current
      .map(p => ({ p, score: scoreProduct(p, q) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
    setResults(scored.map(x => x.p));
    setDdOpen(true);
  }

  function doSearch(term) {
    const q = (typeof term === 'string' ? term : query).trim();
    if (!q) return;
    const h = [q, ...history.filter(x => x !== q)].slice(0, 8);
    setHistory(h);
    localStorage.setItem('ggsSearchHistory', JSON.stringify(h));
    setDdOpen(false);

    if (pathname !== '/' && pathname !== '/home') {
      router.push(`/?search=${encodeURIComponent(q)}#shopSection`);
    } else {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ggsSearch', { detail: q }));
      }
      document.getElementById('shopSection')?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  function pickProduct(p) {
    setQuery(p.name);
    setDdOpen(false);
    if (pathname !== '/' && pathname !== '/home') {
      router.push(`/?search=${encodeURIComponent(p.name)}#shopSection`);
    } else {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ggsSearch', { detail: p.name }));
      }
      document.getElementById('shopSection')?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  useEffect(() => {
    function outside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) setDdOpen(false);
      if (
        notificationsOpen &&
        (!notificationRef.current || !notificationRef.current.contains(e.target)) &&
        !e.target.closest?.('.mob-notification-card') &&
        !e.target.closest?.('.notification-mobile-btn')
      ) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', outside);
    document.addEventListener('touchstart', outside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', outside);
      document.removeEventListener('touchstart', outside);
    };
  }, [notificationsOpen]);

  useEffect(() => {
    function closeOnEscape(e) {
      if (e.key === 'Escape') setNotificationsOpen(false);
    }
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, []);

  return (
    <>
      {/* Mobile overlay */}
      {mobOpen && <div className="mob-overlay open" onClick={() => setMobOpen(false)} />}
      <div className={`mob-nav ${mobOpen ? 'open' : ''}`}>
        <div className="mob-top">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Gupta Store Logo"
              style={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                objectFit: 'contain',
                background: '#ffffff',
                padding: '2px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
              }}
            />
            <span className="mob-logo">Gupta <span>Store</span></span>
          </div>
          <button className="mob-x" onClick={() => setMobOpen(false)}>✕</button>
        </div>
        <Link
          href="/"
         
          className="mob-link"
          onClick={(e) => {
            setMobOpen(false);
            if (pathname === '/' || pathname === '/home') {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
        >
          <AppIcon name="home" size={16} /> Home
        </Link>
        <Link href="/wishlist" className="mob-link" prefetch={false} onClick={() => setMobOpen(false)}><AppIcon name="heart" size={16} /> Wishlist {wishIds.length > 0 && `(${wishIds.length})`}</Link>
        <Link href="/cart" className="mob-link" prefetch={false} onClick={() => setMobOpen(false)}><AppIcon name="cart" size={16} /> Cart {cartCount > 0 && `(${cartCount})`}</Link>
        <Link href="/orders" className="mob-link" prefetch={false} onClick={() => setMobOpen(false)}><AppIcon name="package" size={16} /> My Orders</Link>
        <Link href="/about" className="mob-link" prefetch={false} onClick={() => setMobOpen(false)}><AppIcon name="info" size={16} /> About</Link>
        <Link href="/contact" className="mob-link" prefetch={false} onClick={() => setMobOpen(false)}><AppIcon name="phone" size={16} /> Contact</Link>
                <div className="mob-hr" />
        {user ? (
          <button className="mob-link" style={{border:'none',background:'none',cursor:'pointer',color:'var(--red)'}} onClick={() => { logout(); setMobOpen(false); }}><AppIcon name="logout" size={16} /> Logout ({user.name || user.phone})</button>
        ) : (
          <Link href="/auth" className="mob-link" onClick={() => setMobOpen(false)}><AppIcon name="user" size={16} /> Login / Sign Up</Link>
        )}
      </div>

      <nav className="navbar">
        <button className="ham" onClick={() => setMobOpen(true)} aria-label="Menu">
          <span /><span /><span />
        </button>

        <Link
          href="/"
         
          style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none' }}
          onClick={(e) => {
            if (pathname === '/' || pathname === '/home') {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Gupta Store Official Logo"
            className="brand-logo-img"
            style={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              objectFit: 'contain',
              background: '#ffffff',
              padding: '2px',
              boxShadow: '0 3px 10px rgba(0,0,0,0.2)',
              border: '1.5px solid rgba(255,255,255,0.2)',
              flexShrink: 0
            }}
          />
          <div className="nav-brand-wrap">
            <span className="nav-logo">Gupta <span>Store</span></span>
            <span className="nav-brand-sub">School • Office • Art</span>
          </div>
        </Link>

        {/* Desktop Search */}
        <div className="search-wrap desktop-search-wrap" ref={searchRef} style={{flex:1,maxWidth:620,margin:'0 1rem'}}>
          <div className="nav-search">
            <span className="nav-search-icon">⌕</span>
            <input
              type="text" value={query} placeholder="Search pens, notebooks, colors..."
              onChange={e => handleSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch()}
              onFocus={() => setDdOpen(true)}
              autoComplete="off" aria-label="Search products"
            />
            {query && (
              <button
                className="search-clear visible"
                onClick={() => {
                  setQuery('');
                  setResults([]);
                  setDdOpen(false);
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('ggsSearch', { detail: '' }));
                  }
                }}
              >
                ✕
              </button>
            )}
            <button className="nav-search-btn" onClick={doSearch}>Search</button>
          </div>

          {ddOpen && (
            <div className="search-dropdown open">
              {!query && history.length > 0 && (
                <>
                  <div className="sd-section-title">🕐 Recent Searches</div>
                  {history.slice(0,6).map((h, i) => (
                    <div key={i} className="sd-item" onClick={() => { setQuery(h); handleSearch(h); }}>
                      <span style={{fontSize:'1rem'}}>🕐</span>
                      <span className="sd-info"><span className="sd-name">{h}</span></span>
                    </div>
                  ))}
                </>
              )}
              {query && results.length === 0 && (
                <div style={{padding:'2rem',textAlign:'center',color:'var(--text-muted)',fontSize:'.88rem'}}>
                  <div style={{fontSize:'2rem',marginBottom:'.5rem'}}>🔍</div>
                  <strong>"{query}"</strong> ke liye koi result nahi mila
                </div>
              )}
              {results.map(p => (
                <div key={p.id} className="sd-item" onClick={() => pickProduct(p)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt={p.name} className="sd-img" onError={e => e.target.src='https://placehold.co/42x42/f1f5f9/94a3b8?text=IMG'} />
                  <div className="sd-info">
                    <div className="sd-name" dangerouslySetInnerHTML={{__html: highlightText(p.name, query)}} />
                    <div className="sd-meta">{p.category} • ⭐{p.rating}</div>
                  </div>
                  <span className="sd-price">₹{p.price}</span>
                </div>
              ))}
              {results.length > 0 && (
                <div className="sd-see-all" onClick={() => doSearch(query)}>
                  🔍 "{query}" ke liye saare results List view mein dekho →
                </div>
              )}
            </div>
          )}
        </div>

        <ul className="nav-links">
          <li>
            <Link
              href="/"
             
              className={`nav-link ${pathname === '/' ? 'active' : ''}`}
              onClick={(e) => {
                if (pathname === '/' || pathname === '/home') {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              href="/#shopSection"
             
              className="nav-link"
              onClick={(e) => {
                if (pathname === '/' || pathname === '/home') {
                  e.preventDefault();
                  document.getElementById('shopSection')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              Deals
            </Link>
          </li>
          <li>
            <div className="nav-badge-wrap">
              <Link href="/wishlist" className={`nav-link ${pathname === '/wishlist' ? 'active' : ''}`}>
                Wishlist
              </Link>
              {wishIds.length > 0 && <span className="nav-badge">{wishIds.length}</span>}
            </div>
          </li>
          <li>
            <Link href="/orders" className={`nav-link ${pathname === '/orders' ? 'active' : ''}`}>
              Orders
            </Link>
          </li>
          <li>
            <Link href="/about" className={`nav-link ${pathname === '/about' ? 'active' : ''}`}>
              About
            </Link>
          </li>
                    <li>
            {user ? (
              <div className="notification-wrap" ref={notificationRef}>
                <button className="notification-btn" onClick={() => { setNotificationsOpen(value => !value); markNotificationsRead(); }} aria-label="Notifications" title="Notifications">
                  <AppIcon name="bell" size={18} />
                  {unreadNotifications.length > 0 && <span className="notification-count">{unreadNotifications.length > 9 ? '9+' : unreadNotifications.length}</span>}
                </button>
                {notificationsOpen && (
                  <div className="notification-dropdown">
                    <div className="notification-heading">
                      <div>
                        <strong>Notifications</strong>
                        <small>Order updates & store replies</small>
                      </div>
                      <AppIcon name="bell" size={17} />
                    </div>
                    {notifications.length > 0 ? (
                      notifications.map(notification =>
                        notification.type === 'inquiry_reply' ? (
                          <Link
                            key={notification.id}
                            href="/contact"
                           
                            className="notification-item"
                            onClick={() => setNotificationsOpen(false)}
                            style={{ borderLeft: '3px solid #8b5cf6', background: 'rgba(139, 92, 246, 0.04)' }}
                          >
                            <span className="notification-item-icon" style={{ background: '#ede9fe', color: '#6d28d9', borderRadius: '8px', padding: '4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                              <AppIcon name="reply" size={16} />
                            </span>
                            <span style={{ minWidth: 0, flex: 1 }}>
                              <strong style={{ color: '#6d28d9', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <span>Store Reply</span>
                                <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#ede9fe', color: '#6d28d9', padding: '1px 6px', borderRadius: '4px' }}>Bakani Store</span>
                              </strong>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', marginTop: '2px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                “{notification.subtitle}”
                              </div>
                              <small style={{ marginTop: '3px', display: 'block' }}>Re: {notification.title?.replace('Gupta Store Reply: ', '')} • {formatDate(notification.time)}</small>
                            </span>
                          </Link>
                        ) : (
                          <Link
                            key={notification.id}
                            href={`/track?orderId=${notification.orderId}`}
                           
                            className="notification-item"
                            onClick={() => setNotificationsOpen(false)}
                          >
                            <span className="notification-item-icon">{notification.icon}</span>
                            <span>
                              <strong>{notification.title}</strong>
                              <small>{notification.orderId} • {formatDate(notification.time)}</small>
                            </span>
                          </Link>
                        )
                      )
                    ) : (
                      <div className="notification-empty">
                        <AppIcon name="bell" size={24} />
                        <span>Abhi koi notification nahi hai.</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', borderTop: '1px solid var(--border-light)' }}>
                      <Link href="/profile" className="notification-footer" onClick={() => setNotificationsOpen(false)} style={{ flex: 1 }}>
                        View all orders <span>→</span>
                      </Link>
                      <Link href="/contact" className="notification-footer" onClick={() => setNotificationsOpen(false)} style={{ flex: 1, borderLeft: '1px solid var(--border-light)' }}>
                        Contact Store <span>→</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ) : <Link href="/auth" className="notification-btn" aria-label="Login to view notifications"><AppIcon name="bell" size={18} /></Link>}
          </li>
          <li>
            {user ? (
              <button className="nav-link nav-link-button" onClick={logout}>{user.name || '👤'} Logout</button>
            ) : (
              <Link href="/auth" className="nav-link nav-link-button">Login</Link>
            )}
          </li>
          <li>
            <div className="nav-badge-wrap nav-cart-wrap">
              <Link href="/cart" prefetch={false} className={`nav-link nav-link-cart ${pathname === '/cart' ? 'active' : ''}`}>
                Cart
              </Link>
              {cartCount > 0 && <span className="nav-badge">{cartCount}</span>}
            </div>
          </li>
        </ul>

        {/* Mobile Header Quick Actions */}
        <div className="mob-header-actions">
          <button
            type="button"
            className="mob-header-icon-btn notification-mobile-btn"
            onClick={(e) => {
              e.stopPropagation();
              setNotificationsOpen(v => !v);
              if (!notificationsOpen) markNotificationsRead();
            }}
            aria-label="Notifications"
            title="View Notifications"
          >
            <AppIcon name="bell" size={18} />
            {user && unreadNotifications.length > 0 && (
              <span className="mob-icon-badge">
                {unreadNotifications.length > 9 ? '9+' : unreadNotifications.length}
              </span>
            )}
          </button>
          <Link href="/wishlist" className="mob-header-icon-btn" aria-label="Wishlist">
            ❤️
            {wishIds.length > 0 && <span className="mob-icon-badge">{wishIds.length}</span>}
          </Link>
          <button className="dark-btn" onClick={toggleDark} title="Toggle dark mode" aria-label="Toggle dark mode">
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </nav>

      {/* Mobile Notification Modal / Drawer */}
      {notificationsOpen && (
        <div className="mob-notification-overlay" onClick={() => setNotificationsOpen(false)}>
          <div className="mob-notification-card" onClick={e => e.stopPropagation()}>
            <div className="notification-heading">
              <div>
                <strong style={{ fontSize: '0.95rem' }}>Notifications</strong>
                <small>{user ? 'Order updates & store replies' : 'Gupta Store Bakani'}</small>
              </div>
              <button
                type="button"
                onClick={() => setNotificationsOpen(false)}
                aria-label="Close notifications"
                style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.25rem', cursor: 'pointer', padding: '4px' }}
              >
                ✕
              </button>
            </div>

            <div className="mob-notification-list">
              {!user ? (
                <div className="notification-empty" style={{ padding: '2rem 1.25rem', textAlign: 'center' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(249, 115, 22, 0.12)', color: 'var(--orange)', display: 'grid', placeItems: 'center', margin: '0 auto 0.65rem' }}>
                    <AppIcon name="bell" size={24} />
                  </div>
                  <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)', display: 'block', marginBottom: '0.35rem' }}>Account Login Karein</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5, display: 'block', maxWidth: 260, margin: '0 auto 1.15rem' }}>
                    Apne order status updates aur official store replies dekhne ke liye account login karein.
                  </span>
                  <Link
                    href="/auth"
                   
                    className="btn btn-orange btn-sm"
                    onClick={() => setNotificationsOpen(false)}
                    style={{ borderRadius: '10px', padding: '0.55rem 1.4rem', fontWeight: 700, display: 'inline-block' }}
                  >
                    Login / Register
                  </Link>
                </div>
              ) : notifications.length > 0 ? (
                notifications.map(notification =>
                  notification.type === 'inquiry_reply' ? (
                    <Link
                      key={notification.id}
                      href="/contact"
                     
                      className="notification-item"
                      onClick={() => setNotificationsOpen(false)}
                      style={{ borderLeft: '3px solid #8b5cf6', background: 'rgba(139, 92, 246, 0.04)' }}
                    >
                      <span className="notification-item-icon" style={{ background: '#ede9fe', color: '#6d28d9', borderRadius: '8px', padding: '4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AppIcon name="reply" size={16} />
                      </span>
                      <span style={{ minWidth: 0, flex: 1 }}>
                        <strong style={{ color: '#6d28d9', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span>Store Reply</span>
                          <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#ede9fe', color: '#6d28d9', padding: '1px 6px', borderRadius: '4px' }}>Bakani Store</span>
                        </strong>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', marginTop: '2px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, lineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          “{notification.subtitle}”
                        </div>
                        <small style={{ marginTop: '3px', display: 'block' }}>Re: {notification.title?.replace('Gupta Store Reply: ', '')} • {formatDate(notification.time)}</small>
                      </span>
                    </Link>
                  ) : (
                    <Link
                      key={notification.id}
                      href={`/track?orderId=${notification.orderId}`}
                     
                      className="notification-item"
                      onClick={() => setNotificationsOpen(false)}
                    >
                      <span className="notification-item-icon">{notification.icon}</span>
                      <span>
                        <strong>{notification.title}</strong>
                        <small>{notification.orderId} • {formatDate(notification.time)}</small>
                      </span>
                    </Link>
                  )
                )
              ) : (
                <div className="notification-empty">
                  <AppIcon name="bell" size={26} />
                  <span>Abhi koi naya notification nahi hai.</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', borderTop: '1px solid var(--border-light)' }}>
              <Link href="/orders" className="notification-footer" onClick={() => setNotificationsOpen(false)} style={{ flex: 1, textAlign: 'center', justifyContent: 'center' }}>
                View all orders →
              </Link>
              <Link href="/contact" className="notification-footer" onClick={() => setNotificationsOpen(false)} style={{ flex: 1, textAlign: 'center', justifyContent: 'center', borderLeft: '1px solid var(--border-light)' }}>
                Contact Store →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sticky Search Bar & Delivery Strip (hidden on Cart, Thank You, and Admin) */}
      {!pathname?.startsWith('/cart') && !pathname?.startsWith('/thankyou') && !pathname?.startsWith('/admin') && (
        <>
          <div className="mob-search-bar" ref={searchRef}>
            <div className="mob-search-input-wrap">
              <span className="mob-search-glass">🔍</span>
              <input
                type="text"
                placeholder="Search pens, notebooks, colors..."
                value={query}
                onChange={e => handleSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doSearch()}
                onFocus={() => setDdOpen(true)}
                aria-label="Search store products"
              />
              {query && (
                <button
                  className="mob-search-clear"
                  onClick={() => {
                    setQuery('');
                    setResults([]);
                    setDdOpen(false);
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('ggsSearch', { detail: '' }));
                    }
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {ddOpen && (
              <div className="search-dropdown open" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1001 }}>
                {!query && history.length > 0 && (
                  <>
                    <div className="sd-section-title">🕐 Recent Searches</div>
                    {history.slice(0, 5).map((h, i) => (
                      <div key={i} className="sd-item" onClick={() => { setQuery(h); handleSearch(h); }}>
                        <span style={{ fontSize: '1rem' }}>🕐</span>
                        <span className="sd-info"><span className="sd-name">{h}</span></span>
                      </div>
                    ))}
                  </>
                )}
                {query && results.length === 0 && (
                  <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '.85rem' }}>
                    <div style={{ fontSize: '1.8rem', marginBottom: '.3rem' }}>🔍</div>
                    <strong>&ldquo;{query}&rdquo;</strong> ke liye koi product nahi mila
                  </div>
                )}
                {results.map(p => (
                  <div key={p.id} className="sd-item" onClick={() => pickProduct(p)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image} alt={p.name} className="sd-img" onError={e => e.target.src='https://placehold.co/42x42/f1f5f9/94a3b8?text=IMG'} />
                    <div className="sd-info">
                      <div className="sd-name" dangerouslySetInnerHTML={{ __html: highlightText(p.name, query) }} />
                      <div className="sd-meta">{p.category} • ⭐{p.rating}</div>
                    </div>
                    <span className="sd-price">₹{p.price}</span>
                  </div>
                ))}
                {results.length > 0 && (
                  <div className="sd-see-all" onClick={() => doSearch(query)}>
                    🔍 &ldquo;{query}&rdquo; ke saare results dekho →
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Flipkart / Amazon style Delivery Location Strip */}
          <div className="mob-delivery-bar">
            <span style={{ fontSize: '0.95rem' }}>📍</span>
            <span className="mob-delivery-text">
              Deliver to <strong>Bakani - 326022</strong> ▾
            </span>
            <span className="mob-delivery-pill">⚡ Same-day Delivery</span>
          </div>
        </>
      )}
    </>
  );
}
