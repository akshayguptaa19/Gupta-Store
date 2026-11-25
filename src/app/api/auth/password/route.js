import { NextResponse } from 'next/server';
import { createSessionToken } from '@/lib/security';
import {
  cleanEmail,
  cleanPhone,
  isStrongEnough,
  findUserByEmail,
  findUserByPhone,
  registerAuthUser,
  loginAuthUser,
  resetAuthPassword,
} from '@/lib/supabaseAuth';

function sessionResponse(user, message) {
  const token = createSessionToken({ email: user.email, name: user.name });
  const response = NextResponse.json({
    ok: true,
    user: {
      id: String(user.id || user._id),
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address || '',
      joinedAt: user.createdAt || user.joinedAt,
    },
    token,
    message,
  });
  response.cookies.set('ggs_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12,
  });
  return response;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, email, password, name, phone, address } = body;
    const clean = cleanEmail(email);

    if (!clean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      return NextResponse.json({ ok: false, message: 'Valid email address daalo.' }, { status: 400 });
    }

    if (action === 'REGISTER') {
      const cleanName = String(name || '').trim();
      const cleanP = cleanPhone(phone);

      if (!cleanName) {
        return NextResponse.json({ ok: false, message: 'Kripya apna poora naam daalo.' }, { status: 400 });
      }
      if (cleanP.length !== 10) {
        return NextResponse.json({ ok: false, message: 'Kripya 10-digit mobile number daalo.' }, { status: 400 });
      }
      if (!isStrongEnough(password)) {
        return NextResponse.json({ ok: false, message: 'Password kam se kam 8 characters ka hona chahiye.' }, { status: 400 });
      }

      const existingEmail = await findUserByEmail(clean);
      if (existingEmail) {
        return NextResponse.json({ ok: false, message: 'Is email se account pehle se bana hai. Kripya login karein.' }, { status: 409 });
      }

      const existingPhone = await findUserByPhone(cleanP);
      if (existingPhone) {
        return NextResponse.json({ ok: false, message: 'Is mobile number se account pehle se registered hai.' }, { status: 409 });
      }

      const newUser = await registerAuthUser({
        name: cleanName,
        email: clean,
        phone: cleanP,
        address: String(address || '').trim(),
        password,
      });

      return sessionResponse(
        newUser,
        '🎉 Registration successful! Gupta Store me aapka swagat hai.'
      );
    }

    if (action === 'LOGIN') {
      const loginResult = await loginAuthUser({ email: clean, password });
      if (!loginResult.ok) {
        return NextResponse.json({ ok: false, message: loginResult.message }, { status: loginResult.status || 401 });
      }

      return sessionResponse(loginResult.user, 'Password se login successful!');
    }

    if (action === 'RESET_PASSWORD') {
      if (!isStrongEnough(password)) {
        return NextResponse.json({ ok: false, message: 'Password kam se kam 8 characters ka hona chahiye.' }, { status: 400 });
      }

      const resetResult = await resetAuthPassword(clean, password);
      if (!resetResult.ok) {
        return NextResponse.json({ ok: false, message: resetResult.message }, { status: resetResult.status || 400 });
      }

      return NextResponse.json({ ok: true, message: resetResult.message });
    }

    return NextResponse.json({ ok: false, message: 'Invalid password action.' }, { status: 400 });
  } catch (error) {
    console.error('[Password Auth Error]:', error);
    return NextResponse.json({ ok: false, message: error.message || 'Authentication service temporarily unavailable.' }, { status: 500 });
  }
}
