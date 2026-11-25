import { supabaseAdmin } from './supabaseAdmin.js';

export const STORAGE_BUCKET = 'Gupta_Store';

/**
 * Extracts relative storage file path from a Supabase Storage public URL
 * e.g. "https://evyzbmefpapmulhzudiv.supabase.co/storage/v1/object/public/Gupta_Store/products/1.jpg?v=123"
 * returns "products/1.jpg"
 */
export function extractSupabaseStoragePath(url, bucket = STORAGE_BUCKET) {
  if (!url || typeof url !== 'string') return null;
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx !== -1) {
    const raw = url.slice(idx + marker.length);
    return decodeURIComponent(raw.split('?')[0]);
  }
  return null;
}

/**
 * Deletes an old image from Supabase Storage if it belongs to our bucket
 */
export async function deleteSupabaseStorageImage(imageUrl, bucket = STORAGE_BUCKET) {
  if (!supabaseAdmin || !imageUrl) return false;
  const filePath = extractSupabaseStoragePath(imageUrl, bucket);
  if (!filePath) return false;

  try {
    const { error } = await supabaseAdmin.storage.from(bucket).remove([filePath]);
    if (error) {
      console.warn(`[Supabase Storage] Could not delete old file ${filePath}:`, error.message);
      return false;
    }
    console.log(`[Supabase Storage] Successfully deleted old file: ${filePath}`);
    return true;
  } catch (err) {
    console.warn(`[Supabase Storage] Error deleting ${filePath}:`, err.message);
    return false;
  }
}

