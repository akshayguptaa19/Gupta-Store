'use client';
import { useEffect } from 'react';
import { hydrateStores, useUIStore } from '@/lib/store';

export default function DarkModeInit() {
  const darkMode = useUIStore(s => s.darkMode);
  useEffect(() => {
    hydrateStores();
  }, []);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);
  return null;
}
