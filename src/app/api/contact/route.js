import { NextResponse } from 'next/server';
import { isEmailConfigured, sendContactEmail } from '@/lib/emailService';
import { addInquiry, getCustomerInquiries } from '@/lib/inquiriesStore';

const CONTACT_LIMITS = globalThis.__GGS_CONTACT_LIMITS || (globalThis.__GGS_CONTACT_LIMITS = new Map());
const LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_MESSAGES_PER_WINDOW = 5;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone') || '';
    const email = searchParams.get('email') || '';

    if (!phone && !email) {
      return NextResponse.json({ ok: true, inquiries: [] });
    }

    const inquiries = await getCustomerInquiries(phone, email);
    return NextResponse.json({ ok: true, inquiries });
  } catch (error) {
    console.error('[Contact Inquiries GET Error]:', error);
    return NextResponse.json({ ok: false, message: 'Customer inquiries retrieve nahi ho sake.' }, { status: 500 });
  }
}

function checkContactRateLimit(ip) {
  const now = Date.now();
  const entry = CONTACT_LIMITS.get(ip) || { count: 0, resetAt: now + LIMIT_WINDOW_MS };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + LIMIT_WINDOW_MS;
  }
  entry.count += 1;
  CONTACT_LIMITS.set(ip, entry);
  return entry.count <= MAX_MESSAGES_PER_WINDOW;
}

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    if (!checkContactRateLimit(ip)) {
      return NextResponse.json(
        { ok: false, message: 'Bahut zyada messages. Kripya 1 minute intazar karein.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const name = String(body.name || '').replace(/[<>]/g, '').trim();
    const phone = String(body.phone || '').replace(/\D/g, '').slice(-10);
    const message = String(body.message || '').replace(/[<>]/g, '').trim();
    const subject = String(body.subject || body.queryType || 'General Query').replace(/[<>]/g, '').trim();
    const email = String(body.email || '').trim().toLowerCase();

    if (!name || !/^\d{10}$/.test(phone)) {
      return NextResponse.json({ ok: false, message: 'Valid name aur 10-digit phone number zaroori hai.' }, { status: 400 });
    }
    if (message.length > 2000) {
      return NextResponse.json({ ok: false, message: 'Message 2000 characters se chhota rakhein.' }, { status: 400 });
    }

    const savedInquiry = await addInquiry({
      name,
      phone,
      subject,
      email,
      message,
    });

    let emailSent = false;
    if (isEmailConfigured()) {
      try {
        await sendContactEmail(savedInquiry);
        emailSent = true;
      } catch (error) {
        console.error('[Contact Email Error]:', error.message);
      }
    }

    return NextResponse.json({ ok: true, emailSent, message: 'Message received' }, { status: 201 });
  } catch (error) {
    console.error('[Contact Submit Error]:', error);
    return NextResponse.json({ ok: false, message: 'Message save nahi ho saka. Please dobara try karein.' }, { status: 500 });
  }
}
