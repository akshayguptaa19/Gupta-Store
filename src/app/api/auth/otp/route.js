import { NextResponse } from 'next/server';
import { generateOtp } from '@/lib/security';
import { isEmailConfigured, sendOtpEmail } from '@/lib/emailService';
import { canRequestOtp, recordOtpRequest, storeOtp } from '@/lib/otpStore';
import { findUserByEmail, findUserByPhone } from '@/lib/supabaseAuth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, type, mode, name, phone, password } = body;

    // ── 1. EMAIL OTP FLOW ─────────────────────────────────────────
    if (email || type === 'email') {
      const cleanEmail = String(email || '').trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!cleanEmail || !emailRegex.test(cleanEmail)) {
        return NextResponse.json({ ok: false, message: 'Kripya ek valid email address daalein.' }, { status: 400 });
      }

      const existingUser = await findUserByEmail(cleanEmail);

      if (mode === 'login' && !existingUser) {
        return NextResponse.json({ ok: false, code: 'REGISTRATION_REQUIRED', message: 'Ye email registered nahi hai. Pehle Register karein.' }, { status: 404 });
      }

      if (mode === 'register') {
        const cleanName = String(name || '').trim();
        const cleanPhone = String(phone || '').replace(/\D/g, '').slice(-10);

        if (!cleanName || !/^\d{10}$/.test(cleanPhone)) {
          return NextResponse.json({ ok: false, message: 'Registration ke liye name aur valid 10-digit phone number zaroori hai.' }, { status: 400 });
        }
        if (String(password || '').length < 8) {
          return NextResponse.json({ ok: false, message: 'Password kam se kam 8 characters ka hona chahiye.' }, { status: 400 });
        }
        if (existingUser) {
          return NextResponse.json({ ok: false, code: 'ALREADY_REGISTERED', message: 'Is email se account pehle se registered hai. Login karein.' }, { status: 409 });
        }
        const existingPhone = await findUserByPhone(cleanPhone);
        if (existingPhone) {
          return NextResponse.json({ ok: false, code: 'PHONE_REGISTERED', message: 'Is phone number se account pehle se registered hai.' }, { status: 409 });
        }
      }

      if (mode === 'reset_password' && !existingUser) {
        return NextResponse.json({ ok: false, message: 'Is email se koi account registered nahi hai.' }, { status: 404 });
      }

      const rateLimit = canRequestOtp(cleanEmail);
      if (!rateLimit.allowed) {
        return NextResponse.json({
          ok: false,
          message: 'Naya OTP bhejne se pehle thoda wait karein.',
        }, { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimit.retryAfter / 1000)) } });
      }

      const otp = generateOtp();

      if (!isEmailConfigured()) {
        return NextResponse.json({
          ok: false,
          unconfigured: true,
          message: 'Real Gmail OTP ke liye server par email settings configure karna zaroori hai.',
        }, { status: 400 });
      }

      try {
        await sendOtpEmail(cleanEmail, otp, { mode, name });
        recordOtpRequest(cleanEmail);
        await storeOtp(cleanEmail, otp, mode === 'register'
          ? { mode, name: String(name).trim(), phone: String(phone).replace(/\D/g, '').slice(-10), password, address: String(body.address || '').trim() }
          : { mode });

        return NextResponse.json({
          ok: true,
          email: cleanEmail,
          message: `Verification OTP code aapke email (${cleanEmail}) par bhej diya gaya hai. Kripya apna inbox check karein.`,
        });
      } catch (emailErr) {
        console.error('[Email Send Error]:', emailErr);
        return NextResponse.json({
          ok: false,
          message: 'Email bhejne me samasya aayi. Kripya email address check karein ya dobara koshish karein.',
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      ok: false,
      message: 'Sirf Gmail Email OTP authentication available hai.',
    }, { status: 400 });
  } catch (error) {
    console.error('[OTP Generation Error]:', error);
    return NextResponse.json({ ok: false, message: 'OTP generate karne me samasya aayi.' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    emailConfigured: isEmailConfigured(),
    message: 'Gmail Email OTP API is live',
  });
}
