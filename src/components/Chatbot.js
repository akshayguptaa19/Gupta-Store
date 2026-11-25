'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { generateSupportResponse } from '@/lib/supportModel';
import { useAuthStore } from '@/lib/store';
import AppIcon from '@/components/AppIcon';

const DEFAULT_SUGGESTIONS = [
  '🚚 Delivery charges kitne hain?',
  '📦 Mera order kab aayega?',
  '💵 Cash on Delivery available hai?',
  '🎟️ Available coupon codes?',
  '🔄 Damaged item replacement policy',
  '🏪 Dukan ka pata aur timing?',
];

export default function Chatbot() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore(s => s.user);

  const [open, setOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const [msgs, setMsgs] = useState([
    {
      id: 'msg_welcome',
      type: 'bot',
      text: '👋 Namaste! Main Gupta General Store Bakani ka AI Customer Support Assistant hoon.\n\nMera kaam aapke har order, delivery, cancellation, damaged item replacement aur product sawalon ko turant solve karna hai. Batayein main aapki kya madad kar sakta hoon?',
      suggestions: DEFAULT_SUGGESTIONS,
    },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [suggestions, setSuggestions] = useState(DEFAULT_SUGGESTIONS);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (open) {
      scrollToBottom();
    }
  }, [msgs, typing, open]);

  // Listen to global open event (e.g. from Order Card "Help" button)
  useEffect(() => {
    function handleOpenEvent(e) {
      const order = e.detail?.order || null;
      setOpen(true);
      if (order && order.orderId) {
        setActiveOrder(order);
        const itemNames = (order.items || []).map(i => `${i.name || 'Item'} (x${i.qty || 1})`).join(', ');
        const statusMap = {
          placed: '📋 Order Placed (Under Process)',
          confirmed: '✅ Confirmed (Packing in progress)',
          packed: '📦 Packed (Ready for dispatch)',
          shipped: '🚚 Shipped (Out with delivery partner)',
          delivered: '🏠 Delivered (Safaltapoorvak deliver hua)',
          cancelled: '❌ Cancelled',
        };
        const statusLabel = statusMap[order.status] || order.status || 'Active';

        const orderIntroMsg = {
          id: `order_help_${Date.now()}`,
          type: 'bot',
          text: `👋 Namaste! Main aapke **Order #${order.orderId}** ke liye customer support assistant hoon.\n\n• **Items:** ${itemNames || 'Stationery Items'}\n• **Status:** ${statusLabel}\n• **Total:** ₹${order.total || 0} (${order.payment === 'cod' ? 'Cash on Delivery' : 'Paid'})\n• **Address:** ${order.address?.area || 'Bakani'}\n\nAapko is order ke baare me kya help chahiye?`,
          suggestions: [
            '🚚 Delivery kab tak hogi?',
            '📄 Bill / Receipt download',
            '❌ Order cancel karna hai',
            '🔄 Item damaged / Galat item',
            '💬 WhatsApp manager support',
          ],
          actions: [
            { label: '🚚 Live Track Order', type: 'navigate', url: `/track?orderId=${order.orderId}` },
            { label: '📄 View Receipt', type: 'navigate', url: `/track?orderId=${order.orderId}` },
          ],
        };

        setMsgs(prev => [...prev, orderIntroMsg]);
        setSuggestions(orderIntroMsg.suggestions);
      }
    }

    window.addEventListener('ggsOpenChatbot', handleOpenEvent);
    return () => window.removeEventListener('ggsOpenChatbot', handleOpenEvent);
  }, []);

  function handleSend(textToSend) {
    const text = (textToSend || input).trim();
    if (!text) return;

    setInput('');
    const userMsg = { id: `u_${Date.now()}`, type: 'user', text };
    setMsgs(prev => [...prev, userMsg]);
    setTyping(true);

    setTimeout(() => {
      const response = generateSupportResponse({
        message: text,
        orderContext: activeOrder,
        user,
      });

      const botMsg = {
        id: `b_${Date.now()}`,
        type: 'bot',
        text: response.text,
        actions: response.actions || [],
      };

      setMsgs(prev => [...prev, botMsg]);
      setTyping(false);
      if (response.suggestions && response.suggestions.length > 0) {
        setSuggestions(response.suggestions);
      }
    }, 450);
  }

  function handleActionClick(action) {
    if (!action) return;
    if (action.type === 'navigate' && action.url) {
      router.push(action.url);
    } else if (action.type === 'whatsapp' && action.url) {
      window.open(action.url, '_blank');
    } else if (action.type === 'call' && action.url) {
      window.location.href = action.url;
    } else if (action.type === 'cancel_order') {
      router.push(`/track?orderId=${action.orderId || activeOrder?.orderId || ''}`);
    }
  }

  // Hide completely inside Admin Portal
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      {/* Floating Action Button with pulsing support ring */}
      <button
        className="chatbot-fab"
        onClick={() => setOpen(o => !o)}
        aria-label="Open AI Customer Support"
        title="Gupta Store AI Support Assistant"
        style={{
          boxShadow: '0 8px 25px rgba(139, 92, 246, 0.4)',
        }}
      >
        {open ? '✕' : '💬'}
      </button>

      {/* Modern AI Chatbot Window */}
      {open && (
        <div
          className="chatbot-window"
          style={{
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0,0,0,0.22)',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div
            className="chat-header"
            style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              padding: '0.9rem 1.15rem',
            }}
          >
            <div className="chat-header-info">
              <div
                className="chat-avatar"
                style={{
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  boxShadow: '0 2px 8px rgba(249,115,22,0.4)',
                }}
              >
                🤖
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 800, color: '#ffffff' }}>
                  Gupta Store AI Support
                </h4>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.74rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
                  {activeOrder ? `Order #${activeOrder.orderId} Support` : 'Online • 24/7 Problem Solver'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {activeOrder && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveOrder(null);
                    setSuggestions(DEFAULT_SUGGESTIONS);
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.12)',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#e2e8f0',
                    fontSize: '0.72rem',
                    padding: '0.25rem 0.55rem',
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                  title="Switch to General Store Assistance"
                >
                  General Mode
                </button>
              )}
              <button
                className="chat-close"
                onClick={() => setOpen(false)}
                title="Close chat"
                style={{ fontSize: '1.2rem', padding: '0.2rem' }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Active Order Banner if loaded */}
          {activeOrder && (
            <div
              style={{
                background: 'linear-gradient(90deg, #fff7ed 0%, #ffedd5 100%)',
                borderBottom: '1px solid #fed7aa',
                padding: '0.5rem 1rem',
                fontSize: '0.76rem',
                color: '#c2410c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontWeight: 700,
              }}
            >
              <span>📦 Active Context: Order #{activeOrder.orderId}</span>
              <span style={{ fontSize: '0.7rem', opacity: 0.85 }}>₹{activeOrder.total} • {activeOrder.status}</span>
            </div>
          )}

          {/* Messages Feed */}
          <div className="chat-messages" id="chatMsgs" style={{ padding: '1rem', flex: 1, overflowY: 'auto' }}>
            {msgs.map((m) => (
              <div key={m.id} className={`chat-msg ${m.type}`} style={{ marginBottom: '0.5rem' }}>
                <div
                  className="chat-bubble"
                  style={{
                    whiteSpace: 'pre-line',
                    background: m.type === 'bot' ? 'var(--bg-card)' : 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                    color: m.type === 'bot' ? 'var(--text-primary)' : '#ffffff',
                    border: m.type === 'bot' ? '1px solid var(--border)' : 'none',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    lineHeight: 1.55,
                  }}
                >
                  {m.text}

                  {/* Bot Interactive Action Buttons */}
                  {m.actions && m.actions.length > 0 && (
                    <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {m.actions.map((act, aIdx) => (
                        <button
                          key={aIdx}
                          type="button"
                          onClick={() => handleActionClick(act)}
                          style={{
                            background: act.type === 'whatsapp' ? '#25d366' : act.type === 'cancel_order' ? '#ef4444' : '#0f172a',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.45rem 0.85rem',
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.35rem',
                            textAlign: 'center',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                            transition: 'opacity 0.15s ease',
                          }}
                        >
                          {act.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {typing && (
              <div className="chat-msg bot">
                <div className="chat-bubble" style={{ display: 'flex', gap: '5px', alignItems: 'center', padding: '0.6rem 0.9rem', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>AI Assistant soch raha hai...</span>
                  <span style={{ animation: 'blink 1s infinite' }}>●</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Pills */}
          {suggestions && suggestions.length > 0 && (
            <div
              className="chat-suggestions"
              style={{
                display: 'flex',
                flexWrap: 'nowrap',
                overflowX: 'auto',
                gap: '0.4rem',
                padding: '0.55rem 0.85rem',
                borderTop: '1px solid var(--border-light)',
                background: 'var(--bg)',
                scrollbarWidth: 'none',
              }}
            >
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  className="chat-suggestion"
                  onClick={() => handleSend(s)}
                  style={{
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.74rem',
                    borderRadius: '999px',
                    border: '1px solid rgba(234, 88, 12, 0.3)',
                    background: 'rgba(234, 88, 12, 0.06)',
                    color: '#ea580c',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input Box */}
          <div
            className="chat-input-row"
            style={{
              padding: '0.65rem 0.85rem',
              borderTop: '1px solid var(--border)',
              background: 'var(--bg-card)',
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
            }}
          >
            <input
              className="chat-input"
              type="text"
              value={input}
              placeholder={activeOrder ? `Order #${activeOrder.orderId} ke baare me poochhein...` : 'Apna sawal ya problem likhein...'}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              style={{
                flex: 1,
                padding: '0.6rem 0.95rem',
                borderRadius: '999px',
                border: '1.5px solid var(--border)',
                fontSize: '0.84rem',
                background: 'var(--bg)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
            <button
              className="chat-send"
              onClick={() => handleSend()}
              disabled={!input.trim()}
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: input.trim() ? '#ea580c' : 'var(--text-muted)',
                color: '#ffffff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: input.trim() ? 'pointer' : 'default',
                transition: 'background 0.15s ease',
                flexShrink: 0,
              }}
              title="Send message"
            >
              <AppIcon name="send" size={15} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes blink { 0%,80%,100%{opacity:0.2} 40%{opacity:1} }
      `}</style>
    </>
  );
}
