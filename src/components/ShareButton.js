'use client';
import { useState } from 'react';
import AppIcon from '@/components/AppIcon';
import { useUIStore } from '@/lib/store';

export default function ShareButton({ className = '', style = {}, title = 'Share Store', compact = false }) {
  const showToast = useUIStore(s => s.showToast);
  const [showOptions, setShowOptions] = useState(false);

  const shareData = {
    title: 'Gupta General Store — Bakani',
    text: 'Bakani ka #1 Stationery Store. Ghar baithe mangao pens, notebooks, colors aur 200+ items!',
    url: typeof window !== 'undefined' ? window.location.origin : '',
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        showToast('Dhanyawaad! Store share karne ke liye 🙏', 'success');
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }
    setShowOptions(true);
  };

  const copyLink = () => {
    const url = typeof window !== 'undefined' ? window.location.origin : '';
    navigator.clipboard.writeText(url).then(() => {
      showToast('🔗 Store link copy ho gaya! Kisi ke saath bhi share karein.', 'success');
      setShowOptions(false);
    }).catch(() => {
      showToast('Link copy nahi ho saka', 'error');
    });
  };

  const whatsappShare = () => {
    const url = typeof window !== 'undefined' ? window.location.origin : '';
    const text = encodeURIComponent(`*Gupta General Store - Bakani*\n${shareData.text}\n\n👉 Abhi order karein: ${url}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
    setShowOptions(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleShare}
        className={className || (compact ? 'mob-header-icon-btn' : 'btn btn-ghost btn-sm')}
        style={style}
        title="Share Gupta Store"
        aria-label="Share Store with Friends"
      >
        <AppIcon name="share" size={compact ? 17 : 15} />
        {!compact && <span style={{ marginLeft: '0.35rem' }}>{title}</span>}
      </button>

      {showOptions && (
        <div className="modal-overlay" onClick={() => setShowOptions(false)}>
          <div className="modal-box" style={{ maxWidth: '360px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '1.1rem', fontFamily: 'var(--font-display)' }}>Share Gupta Store</strong>
              <button className="pwa-close-btn" onClick={() => setShowOptions(false)}>✕</button>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Apne dosto aur family ke saath Gupta Store share karein taaki wo bhi ghar baithe order kar sakein!
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <button
                type="button"
                onClick={whatsappShare}
                className="btn"
                style={{ background: '#25d366', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 700 }}
              >
                <AppIcon name="message" size={17} /> WhatsApp par Share Karein
              </button>
              <button
                type="button"
                onClick={copyLink}
                className="btn btn-ghost"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <AppIcon name="fileText" size={16} /> Link Copy Karein
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
