import { NextResponse } from 'next/server';
import { normalizePhone, createSessionToken } from '@/lib/security';
import { getOtp, isOtpValid, clearOtp } from '@/lib/otpStore';
import { findUserByEmail, registerAuthUser } from '@/lib/supabaseAuth';
import { sendWelcomeEmail } from '@/lib/emailService';

export async function POST(request) {
  try {
    const { email, phone, otp } = await request.json();
    const target = email ? String(email).trim().toLowerCase() : normalizePhone(phone);

    if (!target) {
      return NextResponse.json({ ok: false, message: 'Email address zaroori hai' }, { status: 400 });
    }

    if (!otp || String(otp).trim().length !== 6) {
      return NextResponse.json({ ok: false, message: 'Kripya 6-digit ka sahi OTP code enter karein' }, { status: 400 });
    }

    const valid = await isOtpValid(target, otp);
    if (!valid) {
      return NextResponse.json({ ok: false, message: 'OTP galat hai ya expire ho chuka hai (5 min validity)' }, { status: 400 });
    }

    const otpRecord = await getOtp(target);
    let user = await findUserByEmail(target);

    if (otpRecord?.metadata?.mode === 'reset_password') {
      await clearOtp(target);
      return NextResponse.json({ ok: true, resetVerified: true, email: target, message: 'OTP verified. Ab naya password set karein.' });
    }

    if (otpRecord?.metadata?.mode === 'register') {
      if (!user) {
        user = await registerAuthUser({
          name: otpRecord.metadata?.name || 'Customer',
          email: target,
          phone: otpRecord.metadata?.phone || '',
          password: otpRecord.metadata?.password || 'GuptaStore@' + Math.floor(1000 + Math.random() * 9000),
        });

        // Send warm welcome email in background
        try {
          sendWelcomeEmail(target, otpRecord.metadata?.name).catch(err => {
            console.warn('[Welcome Email Send Warning]:', err.message);
          });
        } catch (_) {}
      }
    }

    if (!user) {
      return NextResponse.json({ ok: false, message: 'Account nahi mila. Pehle Register karein.' }, { status: 404 });
    }

    await clearOtp(target);

    const token = createSessionToken({ email: target, name: user.name || 'Customer' });
    const response = NextResponse.json({
      ok: true,
      target,
      user: {
        id: String(user.id || user._id),
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address || '',
        isEmailVerified: true,
        joinedAt: user.createdAt,
      },
      token,
      message: otpRecord?.metadata?.mode === 'register'
        ? '🎉 Email verified! Aapka Gupta Store account create ho gaya.'
        : '✅ OTP safaltapoorvak verify ho gaya!',
    });

    response.cookies.set('ggs_session', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 12,
    });
    return response;
  } catch (error) {
    console.error('[Verify Error]:', error);
    return NextResponse.json({ ok: false, message: 'Verification me samasya aayi. Dobara koshish karein.' }, { status: 500 });
  }
}
