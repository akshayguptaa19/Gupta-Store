import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    let token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      token = request.headers.get('x-admin-token') || '';
    }

    if (!token) {
      token = request.cookies?.get?.('ggs_admin_token')?.value || '';
    }

    if (!token) {
      const body = await request.json().catch(() => ({}));
      token = body.token;
    }

    if (!token || typeof token !== 'string' || !token.includes('.')) {
      return NextResponse.json({ ok: false, valid: false, message: 'No session token provided' }, { status: 401 });
    }

    const dotIndex = token.indexOf('.');
    const b64Payload = token.slice(0, dotIndex);
    const signature  = token.slice(dotIndex + 1);

    if (!b64Payload || !signature) {
      return NextResponse.json({ ok: false, valid: false, message: 'Malformed token' }, { status: 401 });
    }

    const secret = process.env.ADMIN_SECRET || 'gupta-secret-key-salt-99182';

    let payload;
    try {
      payload = Buffer.from(b64Payload, 'base64').toString('utf8');
    } catch {
      return NextResponse.json({ ok: false, valid: false, message: 'Invalid token encoding' }, { status: 401 });
    }

    // Strict payload format: admin:2fa:<issuedAt>:<expiresAt>
    const parts = payload.split(':');
    if (parts.length !== 4 || parts[0] !== 'admin' || parts[1] !== '2fa') {
      return NextResponse.json({ ok: false, valid: false, message: 'Invalid token format' }, { status: 401 });
    }

    // Timing-safe HMAC comparison — prevents timing attacks
    const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return NextResponse.json({ ok: false, valid: false, message: 'Invalid session signature' }, { status: 401 });
    }

    const expiresAt = Number(parts[3]);
    if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
      return NextResponse.json({ ok: false, valid: false, message: 'Session expired' }, { status: 401 });
    }

    return NextResponse.json({
      ok: true,
      valid: true,
      expiresAt,
      message: 'Admin 2FA session valid',
    });
  } catch (error) {
    return NextResponse.json({ ok: false, valid: false, message: 'Verification error' }, { status: 500 });
  }
}
