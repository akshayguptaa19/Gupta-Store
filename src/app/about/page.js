import Link from 'next/link';
import { SHOP } from '@/lib/config';
import AppIcon from '@/components/AppIcon';

export const metadata = {
  title: 'About Us – Gupta General Store Bakani',
  description: '1990 se Bakani ki seva mein. Hamari 35 saal ki kahani, team aur values ke baare mein janiye.',
};

export default function AboutPage() {
  const team = [
    {
      name: 'M.S Gupta',
      role: 'Founder & Managing Director',
      badge: 'Visionary',
      initials: 'MG',
      color: '#f97316',
      bio: '35+ saal ka anubhav. 1990 mein Bakani mein pehla organized stationery store shuru kiya aur imandari ki misaal bane.',
    },
    {
      name: 'Akshay Gupta',
      role: 'Digital & Operations Head',
      badge: 'Technology',
      initials: 'AG',
      color: '#3b82f6',
      bio: 'E-commerce platform, customer experience, logistics, inventory software aur fast doorstep delivery ke prabandhak.',
    },
    {
      name: 'Aditya Gupta',
      role: 'Sales & School Relations',
      badge: 'Client Relations',
      initials: 'AG',
      color: '#10b981',
      bio: 'Schools, coaching institutes aur teachers ke saath bulk tie-ups, store customer support aur retail sales coordinator.',
    },
    {
      name: 'P.K Gupta',
      role: 'Accounts & Sourcing Lead',
      badge: 'Finance & Quality',
      initials: 'PG',
      color: '#8b5cf6',
      bio: 'Direct brand factory sourcing, wholesale inventory audit, billing aur uncompromised quality assurance.',
    },
  ];

  const stats = [
    { num: '35+', label: 'Years of Heritage', sub: 'Serving Bakani since 1990', icon: 'calendar', color: '#f97316' },
    { num: '5,000+', label: 'Happy Customers', sub: 'Students, teachers & families', icon: 'user', color: '#10b981' },
    { num: '1,000+', label: 'Stationery Items', sub: 'Registers, pens, art supplies', icon: 'package', color: '#3b82f6' },
    { num: '4.9★', label: 'Local Rating', sub: 'Trusted across Jhalawar district', icon: 'star', color: '#f59e0b' },
  ];

  const milestones = [
    {
      year: '1990',
      tag: 'Foundation',
      title: 'Pehli Dukan Ki Shuruat',
      desc: 'Main Market, Bakani me ek choti dukan se authentic pens, pencils aur registers ke saath safar shuru hua.',
    },
    {
      year: '2000',
      tag: 'Expansion',
      title: '1,000+ Parivaron Ka Bharosa',
      desc: 'Store ko bada kiya gaya; aaspas ke gaon aur schools ke sabhi students ki pehli pasand Gupta Store bani.',
    },
    {
      year: '2010',
      tag: 'Wholesale Hub',
      title: 'Regional Stationery Destination',
      desc: 'Prime central market location par shift hue, 100+ product categories aur bulk school supply shuru ki gayi.',
    },
    {
      year: '2020',
      tag: 'Service',
      title: 'Doorstep Local Delivery',
      desc: 'Chunautipurna samay mein Bakani ke ghar-ghar tak kitabein aur copies pahunchane ke liye delivery service shuru hui.',
    },
    {
      year: '2024',
      tag: 'Digital Era',
      title: 'Gupta Store Digital Launch',
      desc: 'Bakani ka pehla poori tarah se online stationery store bana, jahan se koi bhi 24x7 order kar sakta hai.',
    },
    {
      year: '2026',
      tag: 'Innovation',
      title: 'Modern E-Commerce Experience',
      desc: 'Live real-time order tracking, email OTP verification, SMS updates aur Cash on Delivery ki sampoorna suvidha.',
    },
  ];

  const pillars = [
    {
      icon: 'shield',
      title: '100% Asli Branded Stationery',
      desc: 'Classmate, Doms, Cello, Reynolds, Apsara jaise top brands se direct sourcing. Koi duplicate ya substandard item nahi.',
    },
    {
      icon: 'sale',
      title: 'Transparent & Wholesale Rates',
      desc: 'Bakani ke sabhi parents aur students ke liye genuine MRP discounts aur transparent, kifaayati kimat.',
    },
    {
      icon: 'truck',
      title: 'Doorstep Fast Delivery',
      desc: 'Aap ghar ya dukan par order karein, hamara delivery partner usi din ya agle din aap tak order pahunchata hai.',
    },
    {
      icon: 'heart',
      title: '3 Peedhiyon Ka Vishwas',
      desc: 'Pehle dada-dadi, phir parents, aur ab bache — 3 generations ne hamari stationery se padhai ki hai.',
    },
  ];

  return (
    <div style={{ background: 'var(--bg-secondary)', minHeight: '100vh', padding: '1.5rem 1.25rem 5rem' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Home</Link>
          <span>/</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>About Us</span>
        </div>

        {/* ── HERO BANNER ────────────────────────────────────────── */}
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: '24px',
            border: '1px solid var(--border)',
            boxShadow: '0 8px 30px -4px rgba(0,0,0,0.05)',
            padding: '3.5rem 2rem',
            textAlign: 'center',
            marginBottom: '2.5rem',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Ambient Glows */}
          <div
            style={{
              position: 'absolute',
              top: '-80px',
              right: '-80px',
              width: '280px',
              height: '280px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-80px',
              left: '-80px',
              width: '280px',
              height: '280px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          <span
            style={{
              fontSize: '0.78rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--orange)',
              background: 'rgba(249,115,22,0.1)',
              padding: '0.35rem 1.1rem',
              borderRadius: '999px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              marginBottom: '1.25rem',
            }}
          >
            <AppIcon name="sparkles" size={13} />
            Est. 1990 • Bakani&#39;s #1 Stationery Store
          </span>

          <div style={{ marginBottom: '1.25rem' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Gupta General Store"
              style={{
                width: 92,
                height: 92,
                borderRadius: '22px',
                objectFit: 'contain',
                background: '#ffffff',
                padding: '6px',
                boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                border: '2px solid rgba(249,115,22,0.3)',
                display: 'inline-block',
              }}
            />
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.1rem, 4.5vw, 3rem)', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 1rem', letterSpacing: '-0.02em' }}>
            Gupta General <span style={{ color: 'var(--orange)' }}>Store</span>
          </h1>

          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: 680, margin: '0 auto 2.5rem' }}>
            35 varsho se Bakani ke vidyarthiyon, adhyapakon aur sabhi parivaron ke liye school, office stationery aur kala samagri ka sabse vishvasniya kendra.
          </p>

          {/* Key Metric Highlights */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.25rem',
              maxWidth: 960,
              margin: '0 auto',
            }}
          >
            {stats.map(s => (
              <div
                key={s.label}
                style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: '16px',
                  border: '1px solid var(--border)',
                  padding: '1.5rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    background: `${s.color}15`,
                    color: s.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <AppIcon name={s.icon} size={22} strokeWidth={2.4} />
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                    {s.num}
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                    {s.sub}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── FOUNDER'S NOTE & STORY ─────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.75rem', marginBottom: '2.5rem' }}>
          
          {/* Founder's Personal Message */}
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: '20px',
              border: '1px solid var(--border)',
              padding: '2.25rem',
              boxShadow: '0 4px 20px -2px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--orange)', marginBottom: '0.85rem' }}>
                <AppIcon name="target" size={14} /> Founder&#39;s Message
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 800, margin: '0 0 1.25rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                &#34;Shiksha Ki Shuruat Ek Achi Copy Aur Pen Se Hoti Hai&#34;
              </h2>
              <blockquote
                style={{
                  margin: 0,
                  padding: '1rem 1.25rem',
                  background: 'var(--bg-secondary)',
                  borderLeft: '4px solid var(--orange)',
                  borderRadius: '0 12px 12px 0',
                  fontSize: '0.94rem',
                  fontStyle: 'italic',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.8,
                }}
              >
                1990 mein humne sirf ek chote sankalp ke sath dukan shuru ki thi — ki Bakani ke kisi bhi bache ko padhai ki samagri ke liye shehar na jaana pade, aur har kisi ko behtareen quality kifaayati dam par mile. Aaj 35 saal baad bhi hamara har faisla is vishwas par tika hai.
              </blockquote>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-light)' }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f97316, #ea580c)',
                  color: '#fff',
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                }}
              >
                MG
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.96rem', color: 'var(--text-primary)' }}>M.S Gupta</strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Founder & Proprietor • Gupta General Store</span>
              </div>
            </div>
          </div>

          {/* Heritage & Values Card */}
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: '20px',
              border: '1px solid var(--border)',
              padding: '2.25rem',
              boxShadow: '0 4px 20px -2px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.76rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--green-dark)', marginBottom: '0.85rem' }}>
              <AppIcon name="check" size={14} /> Hamari Parampara
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 800, margin: '0 0 1.25rem', color: 'var(--text-primary)' }}>
              Hamare 4 Mulya Siddhaant
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              {pillars.map(p => (
                <div key={p.title} style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '10px',
                      background: 'rgba(249,115,22,0.1)',
                      color: 'var(--orange)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <AppIcon name={p.icon} size={17} />
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)', display: 'block' }}>{p.title}</strong>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{p.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── 4 KEY TEAM MEMBERS ──────────────────────────────────── */}
        <div style={{ marginBottom: '2.75rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
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
                marginBottom: '0.5rem',
              }}
            >
              The People Behind The Service
            </span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.65rem', fontWeight: 900, margin: 0, color: 'var(--text-primary)' }}>
              Hamari Leadership & Team
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0.35rem 0 0' }}>
              Jo log niyamit roop se aapke har stationery order aur customer support ko sambhalte hain.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {team.map(member => (
              <div
                key={member.name}
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: '20px',
                  border: '1px solid var(--border)',
                  padding: '1.75rem 1.5rem',
                  boxShadow: '0 4px 18px -2px rgba(0,0,0,0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  position: 'relative',
                }}
              >
                {/* Role badge top right */}
                <span
                  style={{
                    position: 'absolute',
                    top: 14,
                    right: 14,
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: member.color,
                    background: `${member.color}15`,
                    padding: '0.2rem 0.55rem',
                    borderRadius: '999px',
                  }}
                >
                  {member.badge}
                </span>

                {/* Avatar with Glow Ring */}
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${member.color}, ${member.color}cc)`,
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.45rem',
                    fontWeight: 900,
                    marginBottom: '1rem',
                    marginTop: '0.5rem',
                    boxShadow: `0 8px 20px -2px ${member.color}40`,
                    border: '3px solid rgba(255,255,255,0.85)',
                  }}
                >
                  {member.initials}
                </div>

                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.25rem' }}>
                  {member.name}
                </h3>

                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: member.color,
                    marginBottom: '0.85rem',
                  }}
                >
                  {member.role}
                </div>

                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    lineHeight: 1.55,
                    margin: 0,
                  }}
                >
                  {member.bio}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── INTERACTIVE TIMELINE ROADMAP ────────────────────────── */}
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: '24px',
            border: '1px solid var(--border)',
            boxShadow: '0 4px 20px -2px rgba(0,0,0,0.04)',
            padding: '2.5rem 2rem',
            marginBottom: '2.5rem',
          }}
        >
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
                marginBottom: '0.5rem',
              }}
            >
              Our Journey Over Time
            </span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.65rem', fontWeight: 900, margin: 0, color: 'var(--text-primary)' }}>
              Hamara Safar (1990 - 2026)
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0.35rem 0 0' }}>
              Kaise ek chhoti si dukan se shuru hokar Gupta General Store Bakani ka sabse aadhunik stationery store bana.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 760, margin: '0 auto' }}>
            {milestones.map((m, idx) => {
              const isLatest = idx === milestones.length - 1;
              return (
                <div key={m.year} style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                  {/* Left Column: Year Badge & Line */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 68, flexShrink: 0 }}>
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: '16px',
                        background: isLatest
                          ? 'linear-gradient(135deg, var(--orange), var(--orange-dark))'
                          : 'var(--bg-secondary)',
                        color: isLatest ? '#fff' : 'var(--text-primary)',
                        border: isLatest ? 'none' : '1.5px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.9rem',
                        fontWeight: 900,
                        boxShadow: isLatest ? '0 6px 16px rgba(249,115,22,0.35)' : 'none',
                      }}
                    >
                      {m.year}
                    </div>
                    {idx < milestones.length - 1 && (
                      <div style={{ width: 2, height: 38, background: 'var(--border)', margin: '8px 0' }} />
                    )}
                  </div>

                  {/* Right Column: Milestone Details */}
                  <div
                    style={{
                      flex: 1,
                      background: 'var(--bg-secondary)',
                      borderRadius: '14px',
                      border: '1px solid var(--border-light)',
                      padding: '1rem 1.35rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{m.title}</strong>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          color: isLatest ? 'var(--orange)' : 'var(--text-muted)',
                          background: isLatest ? 'rgba(249,115,22,0.12)' : 'var(--gray-200)',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '6px',
                        }}
                      >
                        {m.tag}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.55 }}>
                      {m.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── STORE LOCATION & INTERACTIVE ACTIONS ───────────────── */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(249,115,22,0.12), rgba(234,88,12,0.04))',
            border: '1px solid rgba(249,115,22,0.3)',
            borderRadius: '24px',
            padding: '2.5rem 2rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.25rem',
            boxShadow: '0 8px 30px -4px rgba(249,115,22,0.08)',
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'var(--orange)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppIcon name="shop" size={24} />
          </div>

          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 900, margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>
              Bakani Ki Sabse Vishvasniya Dukan Ab Online!
            </h2>
            <p style={{ fontSize: '0.94rem', color: 'var(--text-secondary)', maxWidth: 580, margin: '0 auto', lineHeight: 1.6 }}>
              School copies, registers, pens, colors aur office stationery ghar baithe mangwayein. Cash on Delivery uplabdh hai aur same-day delivery ki suvidha hai.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.5rem' }}>
            <Link
              href="/"
              className="btn btn-orange"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.85rem 1.85rem',
                fontSize: '0.98rem',
                fontWeight: 800,
                borderRadius: '12px',
                boxShadow: '0 4px 14px rgba(249,115,22,0.35)',
                textDecoration: 'none',
              }}
            >
              <AppIcon name="cart" size={18} />
              Stationery Products Dekhein
            </Link>

            <a
              href={`https://wa.me/${SHOP.whatsapp}?text=${encodeURIComponent('Namaste Gupta Store, mujhe stationery order ke baare me baat karni hai.')}`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.85rem 1.6rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                borderRadius: '12px',
                background: '#25d366',
                color: '#fff',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(37,211,102,0.25)',
              }}
            >
              <AppIcon name="message" size={18} />
              WhatsApp Par Sampark Karein
            </a>

            <Link
              href="/contact"
              className="btn btn-ghost"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.85rem 1.5rem',
                fontSize: '0.92rem',
                fontWeight: 700,
                borderRadius: '12px',
                border: '1.5px solid var(--border)',
                background: 'var(--bg-card)',
                textDecoration: 'none',
              }}
            >
              <AppIcon name="phone" size={17} />
              Dukan Ka Pata & Call
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
