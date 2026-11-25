'use client';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { getMergedProducts, syncProductsFromServer } from '@/lib/products';
import { scoreProduct, formatCurrency } from '@/lib/utils';
import { useWishlistStore, useRecentStore } from '@/lib/store';
import ProductCard from '@/components/ProductCard';
import ProductListItem from '@/components/ProductListItem';
import ProductModal from '@/components/ProductModal';
import CategoryChips from '@/components/CategoryChips';
import FilterPanel from '@/components/FilterPanel';

const HERO_WORDS = ['Pens', 'Notebooks', 'Colors', 'Files', 'Bags', 'Erasers', 'Markers'];
const PAGE_SIZE = 20;

const DEFAULT_FILTERS = {
  cat: 'all', minP: 0, maxP: Infinity, rating: 0,
  inStock: false, discount: false, sort: 'default', search: '',
};

export default function HomePage() {
  const [products, setProducts]     = useState([]);
  const [filters, setFilters]       = useState(DEFAULT_FILTERS);
  const [viewMode, setViewMode]     = useState('grid'); // 'grid' | 'list'
  const [heroWord, setHeroWord]     = useState(0);
  const [heroVisible, setHeroVisible] = useState(true);
  const [modalProduct, setModalProduct] = useState(null);
  const [page, setPage]             = useState(1);
  const [fdOpen, setFdOpen]         = useState(false);
  const [showWish, setShowWish]     = useState(false);

  const wishIds   = useWishlistStore(s => s.ids);
  const recentIds = useRecentStore(s => s.ids);
  const productsMap = useRef({});

  const wishProducts  = products.filter(p => wishIds.includes(p.id));
  const recentProducts = recentIds.map(id => productsMap.current[id]).filter(Boolean).slice(0, 12);

  useEffect(() => {
    // 1. Instant load from local cache
    const prods = getMergedProducts();
    setProducts(prods);
    productsMap.current = Object.fromEntries(prods.map(p => [p.id, p]));

    // 2. Fetch fresh catalog from server (with updated images & admin changes)
    syncProductsFromServer().then(fresh => {
      if (fresh) {
        setProducts(fresh);
        productsMap.current = Object.fromEntries(fresh.map(p => [p.id, p]));
      }
    });

    // 3. Listen for live updates
    function handleUpdate(e) {
      if (Array.isArray(e.detail)) {
        setProducts(e.detail);
        productsMap.current = Object.fromEntries(e.detail.map(p => [p.id, p]));
      }
    }
    window.addEventListener('ggsProductsUpdated', handleUpdate);
    return () => window.removeEventListener('ggsProductsUpdated', handleUpdate);
  }, []);

  // Hero word cycle
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroVisible(false);
      setTimeout(() => {
        setHeroWord(w => (w + 1) % HERO_WORDS.length);
        setHeroVisible(true);
      }, 280);
    }, 2600);
    return () => clearInterval(timer);
  }, []);

  // Listen to search events from Navbar
  useEffect(() => {
    function onNavSearch(e) {
      const query = e.detail || '';
      setFilters(f => ({ ...f, search: query }));
      if (query.trim()) {
        setViewMode('list'); // Auto-switch to Flipkart/Amazon List View on search
      }
      document.getElementById('shopSection')?.scrollIntoView({ behavior: 'smooth' });
    }
    function onOpenWishlist() {
      setShowWish(prev => wishProducts.length > 0 ? !prev : false);
    }
    window.addEventListener('ggsSearch', onNavSearch);
    window.addEventListener('ggsOpenWishlist', onOpenWishlist);
    return () => {
      window.removeEventListener('ggsSearch', onNavSearch);
      window.removeEventListener('ggsOpenWishlist', onOpenWishlist);
    };
  }, [wishProducts.length]);

  // URL params for category and search
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('cat');
    const search = params.get('search');
    if (cat) setFilters(f => ({ ...f, cat }));
    if (search) {
      setFilters(f => ({ ...f, search }));
      setViewMode('list');
    }
  }, []);

  // Filtered + sorted products
  const filtered = useMemo(() => {
    let list = products;

    if (filters.search) {
      list = list
        .map(p => ({ p, score: scoreProduct(p, filters.search) }))
        .filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(x => x.p);
    }

    if (filters.cat !== 'all') list = list.filter(p => p.category === filters.cat);
    if (filters.minP > 0)      list = list.filter(p => p.price >= filters.minP);
    if (filters.maxP < Infinity) list = list.filter(p => p.price <= filters.maxP);
    if (filters.rating > 0)    list = list.filter(p => p.rating >= filters.rating);
    if (filters.inStock)       list = list.filter(p => p.stock > 0);
    if (filters.discount)      list = list.filter(p => p.mrp > p.price);

    if (!filters.search) {
      switch (filters.sort) {
        case 'price-asc':   list = [...list].sort((a, b) => a.price - b.price); break;
        case 'price-desc':  list = [...list].sort((a, b) => b.price - a.price); break;
        case 'rating':      list = [...list].sort((a, b) => b.rating - a.rating); break;
        case 'discount':    list = [...list].sort((a, b) => (b.mrp - b.price) / b.mrp - (a.mrp - a.price) / a.mrp); break;
        case 'reviews':     list = [...list].sort((a, b) => b.reviews - a.reviews); break;
      }
    }

    return list;
  }, [products, filters]);

  const paginated = filtered.slice(0, page * PAGE_SIZE);
  const hasMore   = paginated.length < filtered.length;

  // Active filter count
  const filterCount = useMemo(() => {
    let c = 0;
    if (filters.cat !== 'all') c++;
    if (filters.minP > 0 || filters.maxP < Infinity) c++;
    if (filters.rating > 0) c++;
    if (filters.inStock) c++;
    if (filters.discount) c++;
    return c;
  }, [filters]);

  function clearFilters() {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  }

  function handleFilterChange(f) {
    setFilters(f);
    setPage(1);
  }

  // Active chips
  const chips = [];
  if (filters.cat !== 'all')           chips.push({ l: `📂 ${filters.cat}`, k: 'cat' });
  if (filters.minP > 0 || filters.maxP < Infinity) chips.push({ l: `₹${filters.minP}–${filters.maxP === Infinity ? '∞' : filters.maxP}`, k: 'price' });
  if (filters.rating > 0)             chips.push({ l: `${filters.rating}★+`, k: 'rating' });
  if (filters.inStock)                 chips.push({ l: '✅ In Stock', k: 'inStock' });
  if (filters.discount)               chips.push({ l: '🏷️ On Sale', k: 'disc' });
  if (filters.search)                  chips.push({ l: `🔍 "${filters.search}"`, k: 'search' });

  function removeChip(k) {
    const f = { ...filters };
    if (k === 'cat')     f.cat = 'all';
    if (k === 'price')   { f.minP = 0; f.maxP = Infinity; }
    if (k === 'rating')  f.rating = 0;
    if (k === 'inStock') f.inStock = false;
    if (k === 'disc')    f.discount = false;
    if (k === 'search')  f.search = '';
    setFilters(f);
    setPage(1);
  }

  return (
    <>
      {/* ── HERO ─────────────────────────────────── */}
      <section className="hero">
        <div className="hero-badge">⭐ Bakani ka #1 Stationery Store since 1990</div>
        <h1>
          Ghar baithe mangao{' '}
          <span
            className="hero-highlight"
            style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'none' : 'translateY(-8px)' }}
          >
            {HERO_WORDS[heroWord]}
          </span>{' '}
          aur sab kuch!
        </h1>
        <p>Students, teachers aur ghar – 200+ stationery items. Fast delivery, best prices!</p>
        <div className="hero-btns">
          <button
            className="btn-primary"
            onClick={() => document.getElementById('shopSection')?.scrollIntoView({ behavior: 'smooth' })}
          >
            🛒 Abhi Buy Karo
          </button>
          <button
            className="btn-secondary"
            onClick={() => document.getElementById('shopSection')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Browse Categories
          </button>
        </div>
        <div className="hero-stats">
          {[['200+','Products'],['35+','Saal Experience'],['5000+','Happy Customers'],['4.9★','Rating']].map(([n,l]) => (
            <div className="hero-stat" key={l}>
              <span className="num">{n}</span>
              <span className="label">{l}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="feature-band">
        <div className="feature-card">
          <span>🚚</span>
          <div>
            <strong>Fast delivery</strong>
            <small>Bakani area me same-day shipping</small>
          </div>
        </div>
        <div className="feature-card">
          <span>🔒</span>
          <div>
            <strong>Secure checkout</strong>
            <small>OTP, payment & trusted order flow</small>
          </div>
        </div>
        <div className="feature-card">
          <span>💬</span>
          <div>
            <strong>Instant support</strong>
            <small>Real-time help from our assistant</small>
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ───────────────────────────── */}
      <CategoryChips
        activecat={filters.cat}
        onSelect={cat => { handleFilterChange({ ...filters, cat }); document.getElementById('shopSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
      />

      {/* ── WISHLIST SECTION ─────────────────────── */}
      {showWish && wishProducts.length > 0 && (
        <div className="side-section" id="wishSection">
          <div className="section-header">
            <h2 className="section-title">❤️ Your Wishlist</h2>
            <div style={{display:'flex',gap:'0.6rem',alignItems:'center'}}>
              <button onClick={() => useWishlistStore.getState().clear()} style={{background:'none',border:'none',color:'var(--red)',fontSize:'0.8rem',cursor:'pointer',fontWeight:600}}>Clear All</button>
              <button onClick={() => setShowWish(false)} style={{background:'var(--gray-100)',border:'none',borderRadius:'50%',width:26,height:26,cursor:'pointer',fontSize:'0.9rem',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
            </div>
          </div>
          <div className="side-scroll">
            {wishProducts.map((p, idx) => (
              <div key={`${p.id}_${idx}`} className="side-card" onClick={() => setModalProduct(p)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt={p.name} onError={e => e.target.src='https://placehold.co/80x70/f1f5f9/94a3b8?text=IMG'} />
                <div className="side-card-name">{p.name}</div>
                <div className="side-card-price">₹{p.price}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── RECENTLY VIEWED ──────────────────────── */}
      {recentProducts.length > 0 && (
        <div className="side-section recently-viewed">
          <div className="section-header">
            <h2 className="section-title">🕐 Recently Viewed</h2>
          </div>
          <div className="side-scroll" aria-label="Recently viewed products" tabIndex="0">
            {recentProducts.map((p, idx) => (
              <div key={`${p.id}_${idx}`} className="side-card" onClick={() => setModalProduct(p)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt={p.name} onError={e => e.target.src='https://placehold.co/80x70/f1f5f9/94a3b8?text=IMG'} />
                <div className="side-card-name">{p.name}</div>
                <div className="side-card-price">₹{p.price}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MAIN SHOP ─────────────────────────────── */}
      <div className="shop-layout" id="shopSection">

        {/* Desktop filter sidebar */}
        <FilterPanel filters={filters} onChange={handleFilterChange} onClear={clearFilters} />

        {/* Products area */}
        <div className="products-area">
          {/* Flipkart/Amazon Style Search Results Banner */}
          {filters.search && (
            <div
              style={{
                background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
                border: '1.5px solid #bfdbfe',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1.25rem',
                marginBottom: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <div>
                <span style={{ fontSize: '0.85rem', color: '#1e40af', fontWeight: 600 }}>
                  Search Results for:
                </span>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginLeft: '0.4rem' }}>
                  &ldquo;{filters.search}&rdquo;
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                  ({filtered.length} items found in Gupta Store)
                </span>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => removeChip('search')}
                  style={{
                    background: '#fff',
                    border: '1px solid #93c5fd',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.3rem 0.75rem',
                    fontSize: '0.82rem',
                    color: '#1d4ed8',
                    cursor: 'pointer',
                    fontWeight: 700,
                    transition: 'all 0.15s ease',
                  }}
                >
                  Clear Search ✕
                </button>
              </div>
            </div>
          )}

          <div className="pa-controls">
            <span className="pa-label">
              <strong>{filtered.length}</strong> Products{filters.search && ` for "${filters.search}"`}
            </span>
            <div style={{display:'flex',alignItems:'center',gap:'0.6rem',flexWrap:'wrap'}}>
              {/* View Mode Toggle: Grid or List */}
              <div
                style={{
                  display: 'inline-flex',
                  background: 'var(--gray-100)',
                  borderRadius: 'var(--radius-md)',
                  padding: 3,
                  border: '1px solid var(--border)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  style={{
                    background: viewMode === 'grid' ? 'var(--bg-card)' : 'transparent',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.32rem 0.65rem',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    color: viewMode === 'grid' ? 'var(--orange)' : 'var(--text-muted)',
                    boxShadow: viewMode === 'grid' ? 'var(--shadow-xs)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    transition: 'all 0.15s ease',
                  }}
                  title="Grid View"
                >
                  <span>⊞</span> Grid
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  style={{
                    background: viewMode === 'list' ? 'var(--bg-card)' : 'transparent',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.32rem 0.65rem',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    color: viewMode === 'list' ? 'var(--orange)' : 'var(--text-muted)',
                    boxShadow: viewMode === 'list' ? 'var(--shadow-xs)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    transition: 'all 0.15s ease',
                  }}
                  title="List View"
                >
                  <span>☰</span> List
                </button>
              </div>

              <button className="mob-filter-btn" onClick={() => setFdOpen(true)}>
                🔧 Filters {filterCount > 0 && <span className="mfb-cnt" style={{display:'flex'}}>{filterCount}</span>}
              </button>
              <select
                className="sort-sel"
                value={filters.sort}
                onChange={e => handleFilterChange({ ...filters, sort: e.target.value })}
              >
                <option value="default">Sort: Default</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
                <option value="rating">Highest Rated</option>
                <option value="discount">Best Discount</option>
                <option value="reviews">Most Reviewed</option>
              </select>
            </div>
          </div>

          {/* Active filter chips */}
          {chips.length > 0 && (
            <div className="active-chips">
              {chips.map(c => (
                <span className="a-chip" key={c.k}>
                  {c.l}
                  <button className="chip-x" onClick={() => removeChip(c.k)}>✕</button>
                </span>
              ))}
              <span
                className="a-chip"
                style={{background:'rgba(239,68,68,.1)',borderColor:'rgba(239,68,68,.3)',color:'var(--red)',cursor:'pointer'}}
                onClick={clearFilters}
              >Clear All ✕</span>
            </div>
          )}

          {/* Products rendering: List View (Amazon/Flipkart) vs Grid View */}
          {paginated.length === 0 ? (
            <div className="no-results">
              <div className="no-results-icon">🔍</div>
              <h3>Koi product nahi mila!</h3>
              <p style={{fontSize:'0.88rem',color:'var(--text-muted)',marginTop:'0.5rem'}}>Filters change karo ya search clear karo</p>
              <button
                onClick={clearFilters}
                className="btn btn-load-more"
                style={{marginTop:'1rem'}}
              >Clear Filters</button>
            </div>
          ) : viewMode === 'list' ? (
            <div className="product-list-view">
              {paginated.map((p, idx) => (
                <ProductListItem
                  key={`${p.id}_${idx}`}
                  product={p}
                  onOpen={setModalProduct}
                  onWishlistToggle={setShowWish}
                  searchQuery={filters.search}
                />
              ))}
            </div>
          ) : (
            <div className="products-grid">
              {paginated.map((p, idx) => (
                <ProductCard key={`${p.id}_${idx}`} product={p} onOpen={setModalProduct} onWishlistToggle={setShowWish} />
              ))}
            </div>
          )}

          {/* Load more */}
          {hasMore && (
            <div style={{textAlign:'center',marginTop:'2.5rem',marginBottom:'1.5rem'}}>
              <button
                className="btn btn-load-more"
                onClick={() => setPage(p => p + 1)}
              >
                <span>📦 Load More Products</span>
                <span style={{
                  background: 'var(--orange-light)',
                  color: 'var(--orange-dark)',
                  padding: '0.2rem 0.65rem',
                  borderRadius: '9999px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  marginLeft: '0.25rem',
                  border: '1px solid rgba(249, 115, 22, 0.3)'
                }}>
                  {filtered.length - paginated.length} remaining
                </span>
                <span style={{fontSize:'1.1rem',lineHeight:1}}>↓</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── MOBILE FILTER DRAWER ─────────────────── */}
      {fdOpen && (
        <>
          <div className="fd-overlay open" onClick={() => setFdOpen(false)} />
          <div className="fd-drawer open" style={{padding:'3.5rem 0 4.8rem'}}>
            <button
              onClick={() => setFdOpen(false)}
              style={{position:'absolute',top:'0.8rem',right:'0.8rem',background:'var(--gray-100)',border:'none',borderRadius:'50%',width:32,height:32,cursor:'pointer',fontSize:'1.1rem',display:'flex',alignItems:'center',justifyContent:'center'}}
            >✕</button>
            <FilterPanel filters={filters} onChange={handleFilterChange} onClear={clearFilters} mobile />
            <div className="fd-footer">
              <span>{filtered.length} products found</span>
              <button className="btn btn-orange" onClick={() => setFdOpen(false)}>Apply Filters</button>
            </div>
          </div>
        </>
      )}

      {/* ── FEATURES STRIP ───────────────────────── */}
      <div className="features-strip">
        {[
          { icon: '🚚', title: 'Same Day Delivery', sub: 'Bakani area, ₹100+ pe free' },
          { icon: '💯', title: 'Quality Guaranteed', sub: 'Top brands, authentic products' },
          { icon: '💳', title: 'UPI & Cash Dono', sub: 'PhonePe, GPay, Paytm, COD' },
          { icon: '💬', title: 'WhatsApp Support', sub: '+91-8107615285' },
        ].map(f => (
          <div key={f.title} className="feature-item">
            <span className="feature-icon">{f.icon}</span>
            <div className="feature-text">
              <span className="f-title">{f.title}</span>
              <span className="f-sub">{f.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Product Modal */}
      {modalProduct && (
        <ProductModal product={modalProduct} onClose={() => setModalProduct(null)} />
      )}
    </>
  );
}
