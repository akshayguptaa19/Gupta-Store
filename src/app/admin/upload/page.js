// src/app/admin/upload/page.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getMergedProducts } from '@/lib/products';
import { showToast } from '@/components/Toast';

function fallbackToast(msg, type = 'success') {
  if (typeof window !== 'undefined') {
    alert(`${type.toUpperCase()}: ${msg}`);
  }
}

export default function UploadProductImagePage() {
  const [products, setProducts] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Load product list
  useEffect(() => {
    const list = getMergedProducts();
    setProducts(list);
    if (list.length) setSelectedId(String(list[0].id));

    import('@/lib/products').then(({ syncProductsFromServer }) => {
      syncProductsFromServer().then(fresh => {
        if (fresh && fresh.length) {
          setProducts(fresh);
        }
      });
    });
  }, []);

  // Generate preview URL
  useEffect(() => {
    if (!file) {
      setPreviewUrl('');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedId) {
      (showToast || fallbackToast)('Koi product select nahi kiya.', 'error');
      return;
    }
    if (!file) {
      (showToast || fallbackToast)('Image file select karein.', 'error');
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('productId', selectedId);
      form.append('image', file);
      const res = await fetch('/api/uploadProductImage', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || 'Upload fail ho gaya');

      const newImageUrl = data.url || data.image;
      // Store override so UI picks local image immediately
      const overrides = JSON.parse(localStorage.getItem('ggsProductOverrides') || '{}');
      overrides[selectedId] = { ...(overrides[selectedId] || {}), image: newImageUrl };
      localStorage.setItem('ggsProductOverrides', JSON.stringify(overrides));

      const images = JSON.parse(localStorage.getItem('ggsProductImages') || '{}');
      images[selectedId] = newImageUrl;
      localStorage.setItem('ggsProductImages', JSON.stringify(images));

      setProducts(prev => prev.map(p => String(p.id) === selectedId ? { ...p, image: newImageUrl } : p));

      (showToast || fallbackToast)('Product image successfully upload ho gayi aur storefront par live ho gayi!');
      setFile(null);
    } catch (err) {
      (showToast || fallbackToast)(err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const selectedProduct = products.find(p => String(p.id) === selectedId);
  const currentImage = selectedProduct?.image || '';

  const filteredProducts = searchFilter.trim()
    ? products.filter(p =>
        (p.name || '').toLowerCase().includes(searchFilter.toLowerCase().trim()) ||
        String(p.id).includes(searchFilter.trim()) ||
        (p.category || '').toLowerCase().includes(searchFilter.toLowerCase().trim())
      )
    : products;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        {/* Navigation Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
          <Link
            href="/admin"
            className="pro-btn pro-btn-secondary pro-btn-sm"
          >
            ← Back to Admin Dashboard
          </Link>
          <span style={{ color: '#94a3b8' }}>/</span>
          <span style={{ color: '#64748b', fontWeight: 600 }}>Products</span>
          <span style={{ color: '#94a3b8' }}>/</span>
          <span style={{ color: '#0f172a', fontWeight: 800 }}>Upload Image</span>
        </div>

        {/* Page Card */}
        <div className="pro-card" style={{ padding: '2rem' }}>
          <div style={{ paddingBottom: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                Product Image Upload
              </h1>
              <span className="pro-pill-badge orange">
                Media Manager
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.35rem 0 0' }}>
              Gupta General Store catalog ke kisi bhi product ke liye high-resolution photo select ya update karein.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Step 1: Select Product */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.45rem' }}>
                1. Select Catalog Product *
              </label>

              {/* Quick search filter if catalog has many products */}
              <input
                type="text"
                placeholder="Search product by name or ID..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                className="pro-search-input"
                style={{ marginBottom: '0.5rem', paddingLeft: '0.85rem' }}
              />

              <select
                id="productSelect"
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
                className="pro-select-styled"
                style={{ width: '100%' }}
              >
                {filteredProducts.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ₹{p.price} ({p.category || 'General'}) [ID: #{p.id}]
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Product Summary Box */}
            {selectedProduct && (
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ width: '56px', height: '56px', borderRadius: '0.5rem', background: '#ffffff', border: '1px solid #cbd5e1', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {currentImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={currentImage}
                      alt={selectedProduct.name}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      onError={e => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <span style={{ fontSize: '1.5rem' }}>📦</span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>{selectedProduct.name}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>
                    Category: <strong style={{ color: '#0f172a', textTransform: 'capitalize' }}>{selectedProduct.category}</strong> • Stock: <strong style={{ color: selectedProduct.stock > 0 ? '#047857' : '#b91c1c' }}>{selectedProduct.stock} units</strong>
                  </div>
                </div>
                <div>
                  <span className="pro-pill-badge green">Price: ₹{selectedProduct.price}</span>
                </div>
              </div>
            )}

            {/* Step 2: Choose File */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '0.45rem' }}>
                2. Choose Image File (PNG, JPG, WebP) *
              </label>
              <div
                style={{
                  border: '2px dashed #cbd5e1',
                  borderRadius: '0.75rem',
                  padding: '1.5rem 1rem',
                  textAlign: 'center',
                  background: '#ffffff',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s ease'
                }}
              >
                <input
                  id="imageInput"
                  type="file"
                  accept="image/*"
                  onChange={e => setFile(e.target.files[0])}
                  style={{ display: 'block', margin: '0 auto', fontSize: '0.875rem' }}
                />
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem', marginBottom: 0 }}>
                  Recommended: Square or 4:3 ratio image with clean white or transparent background.
                </p>
              </div>
            </div>

            {/* Image Previews */}
            <div style={{ display: 'grid', gridTemplateColumns: previewUrl ? '1fr 1fr' : '1fr', gap: '1rem' }}>
              {currentImage && (
                <div style={{ textAlign: 'center', padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem' }}>Current Live Image</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentImage}
                    alt="Current"
                    style={{ maxHeight: '160px', margin: '0 auto', objectFit: 'contain', borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: '#fff', padding: '4px' }}
                  />
                </div>
              )}
              {previewUrl && (
                <div style={{ textAlign: 'center', padding: '1rem', background: '#fff7ed', borderRadius: '0.75rem', border: '1px solid #fed7aa' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ea580c', marginBottom: '0.5rem' }}>New Image Selected (Preview)</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Preview"
                    style={{ maxHeight: '160px', margin: '0 auto', objectFit: 'contain', borderRadius: '0.5rem', border: '1px solid #fed7aa', background: '#fff', padding: '4px' }}
                  />
                </div>
              )}
            </div>

            {/* Submit Action */}
            <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.75rem' }}>
              <button
                type="submit"
                disabled={uploading || !file}
                className="pro-btn pro-btn-primary"
                style={{ flex: 1, padding: '0.85rem 1.5rem', fontSize: '0.92rem', opacity: uploading || !file ? 0.6 : 1 }}
              >
                {uploading ? '⏳ Uploading Image to Server...' : '✓ Upload & Set Live'}
              </button>
              <Link
                href="/admin"
                className="pro-btn pro-btn-secondary"
                style={{ padding: '0.85rem 1.5rem', fontSize: '0.92rem' }}
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
