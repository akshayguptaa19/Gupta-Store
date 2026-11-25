'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUIStore, useAuthStore } from '@/lib/store';
import { SHOP } from '@/lib/config';
import { formatDate } from '@/lib/utils';
import AppIcon from '@/components/AppIcon';

export default function ContactPage() {
  const showToast = useUIStore(s => s.showToast);
  const user = useAuthStore(s => s.user);
  const [form, setForm] = useState({ name: '', phone: '', subject: 'General Query', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [pastInquiries, setPastInquiries] = useState([]);

  useEffect(() => {
    if (user?.name || user?.phone) {
      setForm(f => ({
        ...f,
        name: f.name || user.name || '',
        phone: f.phone || user.phone || '',
      }));
    }
  }, [user]);

  async function loadCustomerInquiries(phoneVal) {
    const p = phoneVal || user?.phone || form.phone;
    if (!p) return;
    try {
      const res = await fetch(`/api/contact?phone=${encodeURIComponent(p)}`);
      const data = await res.json();
      if (data?.ok && Array.isArray(data.inquiries)) {
        setPastInquiries(data.inquiries);
      }
    } catch {}
  }

  useEffect(() => {
    if (user?.phone) {
      loadCustomerInquiries(user.phone);
    }
  }, [user?.phone]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      showToast('Kripya apna naam aur phone number bharein!', 'error');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || 'Message send nahi ho saka.');
      setSubmitted(true);
      showToast('Aapka sandesh save ho gaya hai. Hamari team jald contact karegi.', 'success');
      loadCustomerInquiries(form.phone);
    } catch (error) {
      showToast(error.message || 'Message send nahi ho saka.', 'error');
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ background: 'var(--bg-secondary)', minHeight: '100vh', padding: '1.5rem 1.25rem 5rem' }}>
      <div style={{ maxWidth: 1060, margin: '0 auto' }}>
        
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Home</Link>
          <span>/</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Contact Us</span>
        </div>

        {/* Page Hero */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span
            style={{
              fontSize: '0.76rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--orange)',
              background: 'rgba(249,115,22,0.1)',
              padding: '0.3rem 0.85rem',
              borderRadius: '999px',
              display: 'inline-block',
              marginBottom: '0.65rem',
            }}
          >
            We Are Here To Help
          </span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>
            Sampark <span style={{ color: 'var(--orange)' }}>Karein</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.96rem', maxWidth: 540, margin: '0 auto', lineHeight: 1.55 }}>
            Gupta General Store, Bakani se kisi bhi stationery demand, bulk school orders ya delivery enquiry ke liye sampark karein.
          </p>
        </div>

        {/* 2-Column Grid */}
        <div className="contact-main-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.75rem', alignItems: 'start' }}>
          
          {/* Left Column: Store Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Store Card */}
            <div
              style={{
                background: 'var(--bg-card)',
                borderRadius: '20px',
                border: '1px solid var(--border)',
                padding: '1.75rem',
                boxShadow: '0 4px 20px -2px rgba(0,0,0,0.04)',
              }}
            >
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, margin: '0 0 1.25rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AppIcon name="shop" size={20} style={{ color: 'var(--orange)' }} />
                <span>Dukan Ki Jankari</span>
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                {/* Address */}
                <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(249,115,22,0.1)', color: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <AppIcon name="mapPin" size={18} />
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.88rem', color: 'var(--text-primary)' }}>Store Address</strong>
                    <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      Gupta General Store, Main Market, Bakani, Jhalawar, Rajasthan - 326022
                    </span>
                  </div>
                </div>

                {/* Phone */}
                <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(59,130,246,0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <AppIcon name="phone" size={18} />
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.88rem', color: 'var(--text-primary)' }}>Call Us Directly</strong>
                    <a href={`tel:+${SHOP.phone}`} style={{ fontSize: '0.88rem', color: 'var(--orange)', textDecoration: 'none', fontWeight: 700 }}>
                      +91 {SHOP.phone.slice(2)}
                    </a>
                    <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-muted)' }}>M.S Gupta / Store Manager</span>
                  </div>
                </div>

                {/* Timing */}
                <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(16,185,129,0.1)', color: 'var(--green-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <AppIcon name="clock" size={18} />
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.88rem', color: 'var(--text-primary)' }}>Dukan Ka Samay</strong>
                    <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                      Somwar se Ravivar: 8:00 AM – 9:00 PM (Saaton Din Khuli)
                    </span>
                  </div>
                </div>
              </div>

              {/* WhatsApp Action Button */}
              <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-light)' }}>
                <a
                  href={`https://wa.me/${SHOP.whatsapp}?text=${encodeURIComponent('Namaste Gupta Store, mujhe stationery item chahiye.')}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    background: '#25d366',
                    color: '#fff',
                    padding: '0.85rem',
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    textDecoration: 'none',
                    boxShadow: '0 4px 12px rgba(37,211,102,0.25)',
                  }}
                >
                  <AppIcon name="message" size={18} />
                  Direct WhatsApp Chat Shuru Karein
                </a>
              </div>
            </div>

            {/* Quick Highlights Card */}
            <div
              style={{
                background: 'var(--bg-card)',
                borderRadius: '16px',
                border: '1px solid var(--border)',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                <AppIcon name="truck" size={16} style={{ color: 'var(--orange)' }} />
                <span>Bakani & nearby towns mein fast same-day delivery</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                <AppIcon name="shield" size={16} style={{ color: 'var(--green)' }} />
                <span>100% Genuine, tested stationery & school supplies</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                <AppIcon name="card" size={16} style={{ color: '#3b82f6' }} />
                <span>Cash on Delivery (COD) & UPI dono accepted</span>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Message Form */}
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: '20px',
              border: '1px solid var(--border)',
              padding: '2rem',
              boxShadow: '0 4px 20px -2px rgba(0,0,0,0.04)',
            }}
          >
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>
              Online Message Bhejein
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: '0 0 1.5rem', lineHeight: 1.45 }}>
              Neeche diye gaye form ko bharein. Hum jaldi se jaldi aapko phone ya WhatsApp par reply denge.
            </p>

            {submitted ? (
              <div
                style={{
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                  background: 'rgba(16,185,129,0.06)',
                  border: '1.5px solid rgba(16,185,129,0.25)',
                  borderRadius: '16px',
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: 'var(--green)',
                    color: '#fff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem',
                  }}
                >
                  <AppIcon name="check" size={28} strokeWidth={3} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--green-dark)', margin: '0 0 0.35rem' }}>
                  Message Safaltapoorvak Bheja Gaya!
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '0 0 1.25rem' }}>
                  Aapka message Gupta General Store tak pahunch gaya hai. Gupta ji jald hi aapse contact karenge.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setForm({ name: '', phone: '', subject: 'General Query', message: '' });
                  }}
                  className="btn btn-ghost btn-sm"
                  style={{ border: '1px solid var(--border)', borderRadius: '8px' }}
                >
                  Doosra Message Bhejein
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                    <AppIcon name="user" size={14} style={{ color: 'var(--orange)' }} /> Aapka Naam (Full Name) *
                  </label>
                  <input
                    className="form-input"
                    placeholder="e.g. Rahul Gupta"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    required
                    style={{ borderRadius: '10px', padding: '0.75rem 1rem' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                    <AppIcon name="phone" size={14} style={{ color: 'var(--orange)' }} /> Mobile Number (10-Digit) *
                  </label>
                  <input
                    className="form-input"
                    type="tel"
                    placeholder="e.g. 98290XXXXX"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    required
                    style={{ borderRadius: '10px', padding: '0.75rem 1rem' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem', display: 'block' }}>
                    Query Ka Prakar (Subject)
                  </label>
                  <select
                    className="form-input"
                    value={form.subject}
                    onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                    style={{ borderRadius: '10px', padding: '0.75rem 1rem' }}
                  >
                    <option value="General Query">General Stationery Inquiry</option>
                    <option value="Bulk Order">Bulk / School Stationery Order</option>
                    <option value="Product Availability">Product Availability Check</option>
                    <option value="Delivery Timing">Home Delivery Timing / Area</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem', display: 'block' }}>
                    Aapka Sandesh (Message)
                  </label>
                  <textarea
                    className="form-input"
                    rows={4}
                    placeholder="Aapko kaunsi stationery chahiye ya kya sawal hai, yahan likhein..."
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    style={{ borderRadius: '10px', padding: '0.75rem 1rem', resize: 'vertical' }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-orange"
                  disabled={sending}
                  style={{
                    padding: '0.85rem 1.5rem',
                    fontSize: '0.96rem',
                    fontWeight: 800,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 14px rgba(249,115,22,0.3)',
                    marginTop: '0.5rem',
                  }}
                >
                  {sending ? (
                    '⏳ Bheja Ja Raha Hai...'
                  ) : (
                    <>
                      <AppIcon name="send" size={16} />
                      <span>Message Send Karein</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Customer's Past Inquiries & Store Replies */}
        {pastInquiries.length > 0 && (
          <div
            style={{
              marginTop: '2.5rem',
              background: 'var(--bg-card)',
              borderRadius: '20px',
              border: '1px solid var(--border)',
              padding: '1.75rem',
              boxShadow: '0 4px 20px -2px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AppIcon name="message" size={18} style={{ color: 'var(--orange)' }} />
                <span>Aapke Messages & Store Replies</span>
              </h3>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#6d28d9', background: '#ede9fe', padding: '0.2rem 0.65rem', borderRadius: '999px' }}>
                {pastInquiries.filter(i => i.reply).length} Store Replies Received
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {pastInquiries.map(inq => (
                <div key={inq.id || inq._id} style={{ background: 'var(--bg)', borderRadius: '14px', border: '1px solid var(--border-light)', padding: '1.15rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Query: {inq.subject || 'General Inquiry'}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {formatDate(inq.createdAt)}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 0.75rem', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    “{inq.message}”
                  </p>

                  {inq.reply ? (
                    <div style={{ background: '#ede9fe', border: '1.5px solid #ddd6fe', borderRadius: '12px', padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#6d28d9', fontWeight: 800, fontSize: '0.78rem', marginBottom: '0.25rem' }}>
                        <AppIcon name="reply" size={14} strokeWidth={2.4} />
                        <span>Gupta Store Bakani Reply ({formatDate(inq.repliedAt || inq.updatedAt)}):</span>
                      </div>
                      <div style={{ color: '#1e1b4b', fontSize: '0.88rem', lineHeight: 1.55, fontWeight: 500 }}>
                        “{inq.reply}”
                      </div>
                    </div>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.74rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '0.25rem 0.6rem', borderRadius: '6px' }}>
                      <AppIcon name="clock" size={12} />
                      <span>Humari team aapke sandesh ko dekh rahi hai</span>
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
