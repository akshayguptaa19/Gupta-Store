import crypto from 'node:crypto';

export function isValidAdminToken(token) {
  if (!token || typeof token !== 'string') return false;

  const secret = process.env.ADMIN_SECRET || 'gupta-secret-key-salt-99182';
  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return false;

  try {
    const payload = Buffer.from(encodedPayload, 'base64').toString('utf8');
    const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    if (signature.length !== expectedSignature.length) return false;
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) return false;

    const parts = payload.split(':');
    const expiresAt = Number(parts[3]);
    return parts[0] === 'admin' && parts[1] === '2fa' && Number.isFinite(expiresAt) && Date.now() < expiresAt;
  } catch {
    return false;
  }
}

export function requireAdmin(request) {
  const headerToken = request.headers.get('x-admin-token');
  if (headerToken && isValidAdminToken(headerToken)) return true;

  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    const bearerToken = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (bearerToken && isValidAdminToken(bearerToken)) return true;
  }

  const cookieToken = request.cookies?.get?.('ggs_admin_token')?.value;
  if (cookieToken && isValidAdminToken(cookieToken)) return true;

  return false;
}
