'use client';
import { useState } from 'react';
import { CATEGORIES } from '@/lib/config';
import AppIcon from '@/components/AppIcon';

export default function FilterPanel({ filters, onChange, onClear, mobile = false }) {
  const [collapsed, setCollapsed] = useState({});
  const [showAllCategories, setShowAllCategories] = useState(false);

  function toggle(key) {
    setCollapsed(c => ({ ...c, [key]: !c[key] }));
  }

  function FpSection({ id, label, children }) {
    return (
      <div className="fp-section">
        <button
          type="button"
          className={`fp-sec-head ${collapsed[id] ? 'collapsed' : ''}`}
          onClick={() => toggle(id)}
          aria-expanded={!collapsed[id]}
        >
          <span className="fp-sec-label">{label}</span>
          <span className="fp-sec-arrow">▼</span>
        </button>
        <div className={`fp-body ${collapsed[id] ? 'hidden' : ''}`}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <aside className="filter-panel">
      <div className="fp-head">
        <h2 className="fp-title"><AppIcon name="filter" size={17} /> Filters</h2>
        <button className="fp-clear" onClick={onClear}>Clear All</button>
      </div>

      <FpSection id="cat" label="Category">
        {CATEGORIES.slice(0, showAllCategories ? CATEGORIES.length : 6).map(c => (
          <label className="fitem" key={c.key}>
            <input
              type="radio" name={`fcat-${mobile ? 'mob' : 'desk'}`}
              value={c.key} checked={filters.cat === c.key}
              onChange={() => onChange({ ...filters, cat: c.key })}
            />
            <span>{c.emoji} {c.label}</span>
          </label>
        ))}
        {CATEGORIES.length > 6 && (
          <button
            type="button"
            className="fp-more"
            onClick={() => setShowAllCategories(value => !value)}
            aria-expanded={showAllCategories}
          >
            {showAllCategories ? 'Show fewer' : `Show all ${CATEGORIES.length} categories`}
          </button>
        )}
      </FpSection>

      <FpSection id="price" label="Price Range">
        <div className="price-quick">
          {[
            { label: 'Under ₹50', min: 0, max: 50 },
            { label: '₹50–₹150', min: 50, max: 150 },
            { label: '₹150+', min: 150, max: Infinity },
          ].map(r => (
            <button
              key={r.label}
              className={`pq-btn ${filters.minP === r.min && filters.maxP === r.max ? 'active' : ''}`}
              onClick={() => onChange({ ...filters, minP: r.min, maxP: r.max })}
            >{r.label}</button>
          ))}
        </div>
        <div className="price-row" style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <input className="p-inp" type="number" placeholder="Min" min="0"
            value={filters.minP || ''} onChange={e => onChange({ ...filters, minP: Number(e.target.value) || 0 })} />
          <span style={{ color: 'var(--text-muted)', fontSize: '0.73rem' }}>–</span>
          <input className="p-inp" type="number" placeholder="Max" min="0"
            value={filters.maxP === Infinity ? '' : filters.maxP}
            onChange={e => onChange({ ...filters, maxP: e.target.value ? Number(e.target.value) : Infinity })} />
        </div>
        <button className="p-apply" onClick={() => onChange({ ...filters })}>Apply Price</button>
      </FpSection>

      <FpSection id="rating" label="Minimum Rating">
        {[{ v: 0, l: 'All Ratings' }, { v: 4.5, l: '★★★★★ 4.5★+' }, { v: 4, l: '★★★★☆ 4★+' }, { v: 3, l: '★★★☆☆ 3★+' }].map(r => (
          <label className="fitem" key={r.v}>
            <input type="radio" name={`frat-${mobile ? 'mob' : 'desk'}`} value={r.v}
              checked={filters.rating === r.v}
              onChange={() => onChange({ ...filters, rating: r.v })} />
            <span style={{ color: r.v > 0 ? 'var(--yellow)' : undefined }}>{r.l}</span>
          </label>
        ))}
      </FpSection>

      <FpSection id="avail" label="Availability">
        <label className="fitem">
          <input type="checkbox" checked={!!filters.inStock}
            onChange={e => onChange({ ...filters, inStock: e.target.checked })} />
          <span>In Stock Only</span>
        </label>
        <label className="fitem">
          <input type="checkbox" checked={!!filters.discount}
            onChange={e => onChange({ ...filters, discount: e.target.checked })} />
          <span><AppIcon name="sale" size={16} /> On Sale Items</span>
        </label>
      </FpSection>
    </aside>
  );
}
