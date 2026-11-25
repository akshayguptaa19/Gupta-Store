'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore, useUIStore } from '@/lib/store';
import AppIcon from '@/components/AppIcon';
import { SHOP } from '@/lib/config';

export default function ProfilePage() {
  const user = useAuthStore(s => s.user);
  const hydrated = useAuthStore(s => s.hydrated);
  const updateUser = useAuthStore(s => s.updateUser);
  const logout = useAuthStore(s => s.logout);
  const showToast = useUIStore(s => s.showToast);
  const router = useRouter();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    area: '',
    pincode: '326022',
    landmark: '',
  });

  // Populate form with current user and address info
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        area: user.address?.area || user.area || '',
        pincode: user.address?.pincode || user.pincode || '326022',
        landmark: user.address?.landmark || user.landmark || '',
      });
    }
  }, [user]);

  // Initials for avatar
  const initials = useMemo(() => {
    if (!user?.name) return 'GS';
    const parts = user.name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }, [user?.name]);

  function handleSaveProfile(e) {
    if (e) e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Kripya apna Full Name bharein.', 'warning');
      return;
    }
    const cleanPhone = formData.phone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length < 10) {
      showToast('Kripya valid 10-digit mobile number bharein.', 'warning');
      return;
    }

    setSaving(true);
    try {
      const updatedData = {
        name: formData.name.trim(),
        phone: cleanPhone,
        email: user?.email || '', // Email cannot be changed
        area: formData.area.trim(),
        pincode: formData.pincode.trim() || '326022',
        landmark: formData.landmark.trim(),
        address: {
          name: formData.name.trim(),
          phone: cleanPhone,
          area: formData.area.trim(),
          pincode: formData.pincode.trim() || '326022',
          landmark: formData.landmark.trim(),
          city: 'Bakani',
          state: 'Rajasthan',
        },
      };

      updateUser(updatedData);
      showToast('Profile & Address successfully update ho gaya! ✅', 'success');
      setEditModalOpen(false);
    } catch {
      showToast('Profile save nahi ho saka. Dobara try karein.', 'error');
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    if (confirm('Kya aap sach me logout karna chahte hain?')) {
      logout();
      showToast('Aap successfully logout ho gaye.', 'info');
      router.push('/');
    }
  }

  if (!hydrated) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--orange)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  // Not logged in view
  if (!user) {
    return (
      <div style={{ background: 'var(--bg-secondary)', minHeight: '90vh', padding: '2.5rem 1rem calc(100px + env(safe-area-inset-bottom, 20px))' }}>
        <div
          style={{
            maxWidth: 480,
            margin: '0 auto',
            background: 'var(--bg-card)',
            borderRadius: '24px',
            border: '1px solid var(--border)',
            padding: '2.5rem 1.5rem',
            textAlign: 'center',
            boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'rgba(249,115,22,0.12)',
              color: 'var(--orange)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem',
            }}
          >
            <AppIcon name="user" size={34} />
          </div>

          <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>
            My Account
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 1.75rem', lineHeight: 1.5 }}>
            Apna profile, saved address, aur account details manage karne ke liye login karein.
          </p>

          <button
            type="button"
            onClick={() => {
              localStorage.setItem('ggsLoginRedirect', '/profile');
              router.push('/auth');
            }}
            className="btn btn-orange"
            style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', fontSize: '0.95rem', fontWeight: 800, justifyContent: 'center' }}
          >
            Login / Create Account →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg-secondary)', minHeight: '100vh', padding: '1.5rem 1rem calc(115px + env(safe-area-inset-bottom, 20px))' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        {/* Top Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Home</Link>
          <span>/</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>My Account</span>
        </div>

        {/* ── 1. USER PROFILE HERO CARD ─────────────────────── */}
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: '22px',
            border: '1px solid var(--border)',
            boxShadow: '0 6px 24px rgba(0,0,0,0.04)',
            padding: '1.5rem',
            marginBottom: '1rem',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--orange) 0%, var(--orange-dark) 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 900,
                boxShadow: '0 6px 18px rgba(249, 115, 22, 0.35)',
                flexShrink: 0,
              }}
            >
              {initials}
            </div>

            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                  {user.name || 'Gupta Store Customer'}
                </h1>
                {Boolean(user.isVerified || user.verified) ? (
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      color: 'var(--green)',
                      background: 'rgba(22, 163, 74, 0.1)',
                      padding: '0.15rem 0.55rem',
                      borderRadius: '999px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                    }}
                  >
                    <AppIcon name="check" size={11} strokeWidth={3} /> Verified
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-light)',
                      padding: '0.15rem 0.55rem',
                      borderRadius: '999px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                    }}
                  >
                    Registered Customer
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.35rem', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                {user.phone && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                    <AppIcon name="phone" size={13} style={{ color: 'var(--orange)' }} />
                    +91 {user.phone}
                  </span>
                )}
                {user.email && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <AppIcon name="mail" size={13} style={{ color: '#2563eb' }} />
                    {user.email}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Edit Button */}
            <button
              type="button"
              onClick={() => setEditModalOpen(true)}
              className="btn btn-secondary btn-sm"
              style={{
                borderRadius: '10px',
                padding: '0.55rem 1rem',
                fontWeight: 700,
                fontSize: '0.82rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <AppIcon name="edit" size={13} />
              <span>Edit Info</span>
            </button>
          </div>
        </div>

        {/* ── 2. QUICK ACTION SHORTCUTS (ORDERS, WISHLIST, CART) ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.65rem',
            marginBottom: '1rem',
          }}
        >
          <Link
            href="/orders"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '0.9rem 0.6rem',
              textAlign: 'center',
              textDecoration: 'none',
              boxShadow: 'var(--shadow-xs)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(249,115,22,0.1)', color: 'var(--orange)', display: 'grid', placeItems: 'center' }}>
              <AppIcon name="package" size={18} />
            </div>
            <strong style={{ fontSize: '0.84rem', color: 'var(--text-primary)' }}>My Orders</strong>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Live Status →</span>
          </Link>

          <Link
            href="/wishlist"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '0.9rem 0.6rem',
              textAlign: 'center',
              textDecoration: 'none',
              boxShadow: 'var(--shadow-xs)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(239,68,68,0.1)', color: 'var(--red)', display: 'grid', placeItems: 'center' }}>
              <AppIcon name="heart" size={18} />
            </div>
            <strong style={{ fontSize: '0.84rem', color: 'var(--text-primary)' }}>Wishlist</strong>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Saved Items →</span>
          </Link>

          <Link
            href="/cart"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '0.9rem 0.6rem',
              textAlign: 'center',
              textDecoration: 'none',
              boxShadow: 'var(--shadow-xs)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(34,197,94,0.1)', color: 'var(--green)', display: 'grid', placeItems: 'center' }}>
              <AppIcon name="cart" size={18} />
            </div>
            <strong style={{ fontSize: '0.84rem', color: 'var(--text-primary)' }}>Cart</strong>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Checkout →</span>
          </Link>
        </div>

        {/* ── 3. SAVED DELIVERY ADDRESS CARD ─────────────────── */}
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: '20px',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-xs)',
            padding: '1.35rem',
            marginBottom: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <AppIcon name="mapPin" size={17} style={{ color: 'var(--orange)' }} />
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Default Delivery Address
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setEditModalOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--orange)',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <span>Change / Edit</span> →
            </button>
          </div>

          <div
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: '14px',
              padding: '1rem 1.15rem',
              border: '1px solid var(--border-light)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <strong style={{ fontSize: '0.94rem', color: 'var(--text-primary)' }}>
                {user.address?.name || user.name || 'Customer Name'}
              </strong>
              <span style={{ fontSize: '0.72rem', background: 'rgba(249,115,22,0.12)', color: 'var(--orange)', fontWeight: 800, padding: '0.1rem 0.45rem', borderRadius: '4px' }}>
                Home
              </span>
            </div>

            <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {user.address?.area || user.area ? (
                <span>{user.address?.area || user.area}</span>
              ) : (
                <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Mohalla / Landmark address abhi add nahi kiya hai.
                </span>
              )}
            </div>

            {(user.address?.landmark || user.landmark) && (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                📍 Landmark: <strong>{user.address?.landmark || user.landmark}</strong>
              </div>
            )}

            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Bakani, Rajasthan • PIN: <strong>{user.address?.pincode || user.pincode || '326022'}</strong>
            </div>

            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              📞 Contact: <strong>+91 {user.address?.phone || user.phone || 'N/A'}</strong>
            </div>
          </div>
        </div>

        {/* ── 4. STORE SUPPORT & CONTACT ─────────────────────── */}
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: '20px',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-xs)',
            padding: '1.25rem 1.35rem',
            marginBottom: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <strong style={{ fontSize: '0.94rem', color: 'var(--text-primary)', display: 'block' }}>
                Need Help with Account or Order?
              </strong>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Gupta General Store Main Market, Bakani • Open 8 AM - 9 PM
              </span>
            </div>
            <a
              href={`https://wa.me/${SHOP.whatsapp}?text=${encodeURIComponent(`Namaste Gupta Store! Mujhe account ya order support chahiye.`)}`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: '#25d366',
                color: '#fff',
                padding: '0.55rem 1rem',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(37,211,102,0.25)',
              }}
            >
              <AppIcon name="message" size={14} /> WhatsApp Support
            </a>
          </div>
        </div>

        {/* ── 5. LOGOUT BUTTON ──────────────────────────────── */}
        <div style={{ textAlign: 'center', paddingTop: '0.5rem' }}>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              background: 'transparent',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: 'var(--red)',
              borderRadius: '12px',
              padding: '0.75rem 1.8rem',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              transition: 'background 0.15s ease',
            }}
          >
            <AppIcon name="logout" size={15} /> Logout Account
          </button>
        </div>

      </div>

      {/* ── EDIT PROFILE & ADDRESS MODAL ────────────────────── */}
      {editModalOpen && (
        <div
          onClick={() => setEditModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 1100,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              borderRadius: '22px',
              border: '1px solid var(--border)',
              width: '100%',
              maxWidth: 520,
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              padding: '1.75rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                  Edit Profile & Address
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Ye information aapke checkout aur delivery ke liye save hogi
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.95rem',
                    fontSize: '0.92rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontWeight: 600,
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  10-Digit Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={formData.phone}
                  onChange={e => setFormData(p => ({ ...p, phone: e.target.value.replace(/\D/g, '') }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.95rem',
                    fontSize: '0.92rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontWeight: 600,
                  }}
                />
              </div>

              {user?.email && (
                <div
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.8rem',
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>Registered Email:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <AppIcon name="lock" size={12} style={{ color: 'var(--text-muted)' }} />
                    {user.email}
                  </span>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Delivery Address / Mohalla / House No. *
                </label>
                <input
                  type="text"
                  placeholder="Jaise: Main Market, Near Jain Temple, Bakani"
                  value={formData.area}
                  onChange={e => setFormData(p => ({ ...p, area: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.95rem',
                    fontSize: '0.92rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontWeight: 600,
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Nearby Landmark (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Jaise: Near Bus Stand / School ke samne"
                  value={formData.landmark}
                  onChange={e => setFormData(p => ({ ...p, landmark: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.95rem',
                    fontSize: '0.92rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontWeight: 600,
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Pincode
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={formData.pincode}
                    onChange={e => setFormData(p => ({ ...p, pincode: e.target.value.replace(/\D/g, '') }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.95rem',
                      fontSize: '0.92rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      fontWeight: 600,
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    City & State
                  </label>
                  <input
                    type="text"
                    disabled
                    value="Bakani, Rajasthan"
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.95rem',
                      fontSize: '0.88rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-muted)',
                      fontWeight: 600,
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end', marginTop: '1rem', borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="btn btn-ghost"
                  style={{ borderRadius: '10px', padding: '0.65rem 1.25rem', border: '1px solid var(--border)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-orange"
                  style={{ borderRadius: '10px', padding: '0.65rem 1.6rem', fontWeight: 800 }}
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
