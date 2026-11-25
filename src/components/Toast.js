'use client';
import { useUIStore } from '@/lib/store';

export function showToast(msg, type = 'success') {
  useUIStore.getState().showToast(msg, type);
}

export default function Toast() {
  const toast = useUIStore(s => s.toast);
  if (!toast) return null;
  return (
    <div className="toast-container">
      <div className={`toast ${toast.type || 'success'}`} key={toast.id}>
        <span>{toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}</span>
        <span>{toast.msg}</span>
      </div>
    </div>
  );
}
