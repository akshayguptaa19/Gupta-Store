import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { getAllInquiries, updateInquiryStatus, deleteInquiry, replyToInquiry } from '@/lib/inquiriesStore';

export async function GET(request) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ ok: false, message: 'Admin authentication required' }, { status: 401 });
  }

  try {
    const inquiries = await getAllInquiries();
    return NextResponse.json({ ok: true, inquiries });
  } catch (error) {
    console.error('[Admin Inquiries Error]:', error);
    return NextResponse.json({ ok: false, message: 'Messages service temporarily unavailable' }, { status: 500 });
  }
}

export async function PATCH(request) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ ok: false, message: 'Admin authentication required' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, status, action, reply } = body;

    if (!id) {
      return NextResponse.json({ ok: false, message: 'Inquiry ID is required.' }, { status: 400 });
    }

    // Support Reply Action
    if (action === 'REPLY' || reply !== undefined) {
      const cleanReply = String(reply || '').trim();
      if (!cleanReply) {
        return NextResponse.json({ ok: false, message: 'Reply text cannot be empty.' }, { status: 400 });
      }
      const updated = await replyToInquiry(id, cleanReply);
      if (!updated) {
        return NextResponse.json({ ok: false, message: 'Message not found.' }, { status: 404 });
      }
      return NextResponse.json({ ok: true, inquiry: updated, message: 'Reply sent successfully' });
    }

    if (!['read', 'unread', 'replied'].includes(status)) {
      return NextResponse.json({ ok: false, message: 'Invalid inquiry update.' }, { status: 400 });
    }

    const updated = await updateInquiryStatus(id, status);
    if (!updated) {
      return NextResponse.json({ ok: false, message: 'Message not found.' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, status, inquiry: updated });
  } catch (error) {
    console.error('[Admin Inquiries PATCH Error]:', error);
    return NextResponse.json({ ok: false, message: 'Message update failed.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ ok: false, message: 'Admin authentication required' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ ok: false, message: 'Inquiry ID is required.' }, { status: 400 });
    }

    const deleted = await deleteInquiry(id);
    if (!deleted) {
      return NextResponse.json({ ok: false, message: 'Message not found.' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, message: 'Inquiry deleted successfully' });
  } catch (error) {
    console.error('[Admin Inquiries DELETE Error]:', error);
    return NextResponse.json({ ok: false, message: 'Failed to delete message.' }, { status: 500 });
  }
}
