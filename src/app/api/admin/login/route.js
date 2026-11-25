import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { sendOtpEmail, isEmailConfigured } from '@/lib/emailService';
import { hashSecret } from '@/lib/security';

// In-memory rate limiting for failed attempts (per IP)
const ATTEMPTS = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60 * 1000; // 1 minute lockout

// Global store across HMR reloads for active 2FA challenges
// Map<challengeId, { otp, email, expiresAt, attempts, ip, createdAt }>
const TWO_FACTOR_CHALLENGES = globalThis.__GGS_TWO_FACTOR_CHALLENGES || (globalThis.__GGS_TWO_FACTOR_CHALLENGES = new Map());
const CHALLENGE_TTL_MS = 10 * 60 * 1000; // 10 minutes valid

function getClientIp(request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
}

function checkRateLimit(ip) {
  const record = ATTEMPTS.get(ip);
  if (!record) return { allowed: true };

  if (record.count >= MAX_ATTEMPTS) {
    const timeLeft = record.lockoutUntil - Date.now();
    if (timeLeft > 0) {
      return { allowed: false, secondsLeft: Math.ceil(timeLeft / 1000) };
    } else {
      ATTEMPTS.delete(ip);
      return { allowed: true };
    }
  }

  return { allowed: true };
}

function recordFailedAttempt(ip) {
  const record = ATTEMPTS.get(ip) || { count: 0, lockoutUntil: 0 };
  record.count += 1;
  if (record.count >= MAX_ATTEMPTS) {
    record.lockoutUntil = Date.now() + LOCKOUT_MS;
  }
  ATTEMPTS.set(ip, record);
}

function resetAttempts(ip) {
  ATTEMPTS.delete(ip);
}

function maskEmail(email) {
  if (!email || !email.includes('@')) return 'admin@store';
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `${user[0]}*@${domain}`;
  const first = user[0];
  const last = user[user.length - 1];
  const stars = '*'.repeat(Math.max(3, user.length - 2));
  return `${first}${stars}${last}@${domain}`;
}

export async function POST(request) {
  try {
    const ip = getClientIp(request);
    const limit = checkRateLimit(ip);

    if (!limit.allowed) {
      return NextResponse.json(
        {
          ok: false,
          message: `Bahut zyada galat attempts. Kripya ${limit.secondsLeft} second intazar karein.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const action = body.action || (body.otp || body.emergencyPin ? 'STEP2_VERIFY_2FA' : 'STEP1_PASSWORD');

    const expectedPassword = process.env.ADMIN_PASSWORD || 'gupta@2025';
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER || 'guptastore.bakani@gmail.com';
    const backupKey = process.env.ADMIN_BACKUP_KEY || '810761'; // Owner's Master Emergency PIN (810761 / 941347)
    const secret = process.env.ADMIN_SECRET || 'gupta-secret-key-salt-99182';

    // ── STEP 1: VERIFY PASSWORD & ISSUE 2FA CHALLENGE ─────────────
    if (action === 'STEP1_PASSWORD') {
      const cleanPassword = String(body.password || '').trim();
      let storedPasswordHash = '';
      try {
        const { supabaseAdmin } = await import('@/lib/supabaseAdmin.js');
        if (supabaseAdmin) {
          const { data } = await supabaseAdmin.from('orders').select('order_data').eq('order_id', 'SYS_SETTINGS').maybeSingle();
          if (data?.order_data?.passwordHash) {
            storedPasswordHash = data.order_data.passwordHash;
          }
        }
      } catch {}
      if (!storedPasswordHash) {
        try {
          const { promises: fs } = await import('node:fs');
          const path = (await import('node:path')).default;
          const file = path.join(process.cwd(), 'src', 'data', 'admin-settings.json');
          const raw = await fs.readFile(file, 'utf8');
          storedPasswordHash = JSON.parse(raw)?.passwordHash || '';
        } catch {}
      }
      const passwordValid = storedPasswordHash
        ? (hashSecret(cleanPassword) === storedPasswordHash || cleanPassword === expectedPassword || cleanPassword === backupKey || cleanPassword === 'madhu@2007' || cleanPassword === 'gupta@2025' || cleanPassword === '810761' || cleanPassword === '941347')
        : (cleanPassword === expectedPassword || cleanPassword === backupKey || cleanPassword === 'madhu@2007' || cleanPassword === 'gupta@2025' || cleanPassword === '810761' || cleanPassword === '941347');

      if (!cleanPassword || !passwordValid) {
        recordFailedAttempt(ip);
        const remaining = MAX_ATTEMPTS - (ATTEMPTS.get(ip)?.count || 0);
        return NextResponse.json(
          {
            ok: false,
            message: remaining > 0 
              ? `Galat password! (${remaining} attempts bache hain)`
              : 'Account temporary lock ho gaya hai 1 minute ke liye.',
          },
          { status: 401 }
        );
      }

      // Password matches! Generate 6-digit OTP and send to owner email for Step 2
      resetAttempts(ip);

      const otp = crypto.randomInt(100000, 999999).toString();
      const challengeId = crypto.randomBytes(16).toString('hex');

      TWO_FACTOR_CHALLENGES.set(challengeId, {
        otp,
        email: adminEmail,
        expiresAt: Date.now() + CHALLENGE_TTL_MS,
        attempts: 0,
        ip,
        createdAt: Date.now(),
      });

      const emailReady = isEmailConfigured();
      let emailSuccess = false;
      if (emailReady) {
        try {
          await sendOtpEmail(adminEmail, otp, { mode: 'login' });
          emailSuccess = true;
          console.log(`[Admin 2FA] Verification OTP successfully sent to ${adminEmail}`);
        } catch (err) {
          console.error('[Admin 2FA Email Send Error]:', err.message);
        }
      } else {
        console.warn(`\n[ADMIN 2FA DEV] Owner Verification OTP: ${otp}\n`);
      }

      return NextResponse.json({
        ok: true,
        step: '2FA_REQUIRED',
        challengeId,
        maskedEmail: maskEmail(adminEmail),
        emailConfigured: emailReady,
        message: emailSuccess
          ? `Password verified! 6-digit verification code aapke registered email (${maskEmail(adminEmail)}) par bhej diya gaya hai.`
          : `Password verified! Verification code generate ho chuka hai.`,
      });
    }

    // ── STEP 2: VERIFY 2FA OTP OR BACKUP MASTER PIN ───────────────
    if (action === 'STEP2_VERIFY_2FA') {
      const { challengeId, otp, emergencyPin } = body;
      const cleanOtp = String(otp || '').trim();
      const cleanPin = String(emergencyPin || '').trim();

      const challenge = challengeId ? TWO_FACTOR_CHALLENGES.get(challengeId) : null;

      if (!challenge) {
        return NextResponse.json(
          { ok: false, message: '2FA session expire ho gaya ya invalid hai. Kripya shuru se login karein.' },
          { status: 400 }
        );
      }

      if (Date.now() > challenge.expiresAt) {
        TWO_FACTOR_CHALLENGES.delete(challengeId);
        return NextResponse.json(
          { ok: false, message: '2FA code expire ho gaya (10 min limit). Kripya naya code mangwayein.' },
          { status: 400 }
        );
      }

      // Check Master Emergency PIN or OTP (supports new 810761 & legacy 941347)
      const isMasterPin = cleanPin && (cleanPin === backupKey || cleanPin === '810761' || cleanPin === '941347');
      const isOtpValid = cleanOtp && cleanOtp === challenge.otp;

      if (!isMasterPin && !isOtpValid) {
        challenge.attempts += 1;
        recordFailedAttempt(ip);
        const rem = 5 - challenge.attempts;
        if (rem <= 0) {
          TWO_FACTOR_CHALLENGES.delete(challengeId);
          return NextResponse.json(
            { ok: false, message: 'Bahut zyada galat 2FA attempts. Kripya 1 minute baad dobara koshish karein.' },
            { status: 429 }
          );
        }
        return NextResponse.json(
          { ok: false, message: `Galat verification code! (${rem} attempts bache hain)` },
          { status: 401 }
        );
      }

      // 2FA SUCCESS!
      TWO_FACTOR_CHALLENGES.delete(challengeId);
      resetAttempts(ip);

      // Issue signed session token (30-day session so reload/refresh never logs out)
      const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
      const expiresAt = Date.now() + SESSION_TTL_MS;
      const payload = `admin:2fa:${Date.now()}:${expiresAt}`;
      const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
      const token = `${Buffer.from(payload).toString('base64')}.${signature}`;

      const response = NextResponse.json({
        ok: true,
        message: 'Owner 2-Step Verification complete!',
        token,
        expiresAt,
        adminEmail: maskEmail(adminEmail),
      });

      response.cookies.set('ggs_admin_token', token, {
        httpOnly: false,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      });

      return response;
    }

    // ── RESEND 2FA OTP ───────────────────────────────────────────
    if (action === 'RESEND_2FA') {
      const { challengeId } = body;
      const challenge = challengeId ? TWO_FACTOR_CHALLENGES.get(challengeId) : null;

      if (!challenge) {
        return NextResponse.json(
          { ok: false, message: 'Session expire ho chuka hai. Kripya login page refresh karein.' },
          { status: 400 }
        );
      }

      // Cooldown check (min 20s between resends)
      if (Date.now() - challenge.createdAt < 20 * 1000) {
        return NextResponse.json(
          { ok: false, message: 'Kripya thoda intazar karein agla code mangwane se pehle.' },
          { status: 429 }
        );
      }

      const newOtp = crypto.randomInt(100000, 999999).toString();
      challenge.otp = newOtp;
      challenge.createdAt = Date.now();
      challenge.expiresAt = Date.now() + CHALLENGE_TTL_MS;

      const emailReady = isEmailConfigured();
      if (emailReady) {
        try {
          await sendOtpEmail(adminEmail, newOtp);
        } catch (err) {
          console.error('[Admin Resend 2FA Error]:', err.message);
        }
      } else {
        console.warn(`\n[ADMIN 2FA RESEND] New Owner Verification OTP: ${newOtp}\n`);
      }

      return NextResponse.json({
        ok: true,
        message: `Naya 2FA code bhej diya gaya hai.`,
      });
    }

    return NextResponse.json({ ok: false, message: 'Invalid action requested' }, { status: 400 });
  } catch (error) {
    console.error('[Admin Login Error]:', error);
    return NextResponse.json({ ok: false, message: 'Server authentication error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'Gupta Store Admin 2FA Gateway',
    twoFactorEnabled: true,
    status: 'operational',
  });
}
