import { supabaseAdmin } from './supabaseAdmin.js';
import { supabase } from './supabase.js';

export function cleanEmail(value) {
  return String(value || '').trim().toLowerCase();
}

export function cleanPhone(value) {
  return String(value || '').replace(/\D/g, '').slice(-10);
}

export function isStrongEnough(password) {
  return typeof password === 'string' && password.length >= 8;
}

export function mapAuthUser(u) {
  if (!u) return null;
  const meta = u.user_metadata || {};
  return {
    id: u.id,
    _id: u.id,
    name: meta.name || 'Customer',
    email: u.email || '',
    phone: meta.phone || '',
    address: meta.address || '',
    role: meta.role || 'customer',
    blocked: !!meta.blocked,
    blockReason: meta.blockReason || '',
    createdAt: u.created_at,
    updatedAt: u.updated_at,
    joinedAt: u.created_at,
  };
}

let _cachedUsersList = null;
let _cachedUsersTime = 0;
const USERS_CACHE_TTL_MS = 30000;

export function invalidateUsersCache() {
  _cachedUsersList = null;
  _cachedUsersTime = 0;
}

async function getCachedUsers(forceFresh = false) {
  const now = Date.now();
  if (!forceFresh && _cachedUsersList && (now - _cachedUsersTime < USERS_CACHE_TTL_MS)) {
    return _cachedUsersList;
  }
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error || !data?.users) return _cachedUsersList || [];
    _cachedUsersList = data.users;
    _cachedUsersTime = Date.now();
    return data.users;
  } catch (err) {
    console.error('[SupabaseAuth] getCachedUsers error:', err.message);
    return _cachedUsersList || [];
  }
}

export async function findUserByEmail(email) {
  if (!supabaseAdmin) return null;
  const clean = cleanEmail(email);
  if (!clean) return null;

  try {
    const users = await getCachedUsers();
    const found = users.find(u => cleanEmail(u.email) === clean);
    return found ? mapAuthUser(found) : null;
  } catch (err) {
    console.error('[SupabaseAuth] findUserByEmail error:', err.message);
    return null;
  }
}

export async function findUserByPhone(phone) {
  if (!supabaseAdmin) return null;
  const clean = cleanPhone(phone);
  if (clean.length !== 10) return null;

  try {
    const users = await getCachedUsers();
    const found = users.find(u => cleanPhone(u.user_metadata?.phone) === clean);
    return found ? mapAuthUser(found) : null;
  } catch (err) {
    console.error('[SupabaseAuth] findUserByPhone error:', err.message);
    return null;
  }
}

export async function registerAuthUser({ email, password, name, phone, address }) {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not configured');
  }

  const clean = cleanEmail(email);
  const cleanP = cleanPhone(phone);
  const cleanN = String(name || '').trim();
  const cleanA = String(address || '').trim();

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: clean,
    password,
    email_confirm: true,
    user_metadata: {
      name: cleanN,
      phone: cleanP,
      address: cleanA,
      role: 'customer',
      blocked: false,
    },
  });

  if (error) {
    throw error;
  }

  invalidateUsersCache();
  return mapAuthUser(data.user);
}

export async function loginAuthUser({ email, password }) {
  const clean = cleanEmail(email);

  // First check if user is blocked
  const user = await findUserByEmail(clean);
  if (!user) {
    return { ok: false, status: 404, message: 'Account nahi mila. Pehle register karein.' };
  }

  if (user.blocked) {
    return {
      ok: false,
      status: 403,
      message: user.blockReason
        ? `Aapka account temporarily blocked hai: ${user.blockReason}`
        : 'Aapka account temporarily blocked hai. Support se contact karein.',
    };
  }

  // Use public client signInWithPassword
  const { data, error } = await supabase.auth.signInWithPassword({
    email: clean,
    password,
  });

  if (error || !data?.user) {
    return { ok: false, status: 401, message: 'Email ya password galat hai.' };
  }

  return { ok: true, user: mapAuthUser(data.user) };
}

export async function resetAuthPassword(email, newPassword) {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not configured');
  }

  const clean = cleanEmail(email);
  const user = await findUserByEmail(clean);
  if (!user) {
    return { ok: false, status: 404, message: 'Is email se koi account registered nahi hai.' };
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    password: newPassword,
  });

  if (error) {
    throw error;
  }

  return { ok: true, message: 'Password successfully update ho gaya. Ab password se login karein.' };
}

export async function listAllCustomers() {
  if (!supabaseAdmin) return [];

  try {
    const users = await getCachedUsers();
    return (users || []).map(mapAuthUser).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (err) {
    console.error('[SupabaseAuth] listAllCustomers error:', err.message);
    return [];
  }
}

export async function updateCustomerBlock({ email, phone, blocked, reason }) {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not configured');
  }

  const cleanE = cleanEmail(email);
  const cleanP = cleanPhone(phone);

  const users = await getCachedUsers();
  if (!users || users.length === 0) {
    throw new Error('Could not fetch user list');
  }

  const user = users.find(u => {
    if (cleanE && cleanEmail(u.email) === cleanE) return true;
    if (cleanP && cleanPhone(u.user_metadata?.phone) === cleanP) return true;
    return false;
  });

  if (!user) {
    return { ok: false, status: 404, message: 'Customer account nahi mila.' };
  }

  const updatedMeta = {
    ...(user.user_metadata || {}),
    blocked: Boolean(blocked),
    blockReason: blocked ? String(reason || 'Admin action').slice(0, 180) : '',
    blockedAt: blocked ? new Date().toISOString() : null,
  };

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    user_metadata: updatedMeta,
  });

  if (updateError) {
    throw updateError;
  }

  invalidateUsersCache();
  return { ok: true, blocked: Boolean(blocked) };
}
