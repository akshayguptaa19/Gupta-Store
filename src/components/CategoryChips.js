'use client';
import { CATEGORIES } from '@/lib/config';
import AppIcon from '@/components/AppIcon';

export default function CategoryChips({ activecat, onSelect }) {
  return (
    <div className="categories-section">
      <div className="categories-scroll">
        {CATEGORIES.map(c => {
          const isActive = activecat === c.key;
          return (
            <button
              key={c.key}
              className={`cat-pill ${isActive ? 'active' : ''}`}
              onClick={() => onSelect(c.key)}
              aria-label={`Category ${c.label}`}
            >
              <span className="cat-pill-icon"><AppIcon name={c.emoji} size={17} /></span>
              <span className="cat-pill-label">{c.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
