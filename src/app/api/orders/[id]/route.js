import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { sendDeliveryEmail, sendOrderStatusEmail } from '@/lib/emailService';
import { getSupabaseOrderById, updateSupabaseOrder, deleteSupabaseOrder } from '@/lib/supabaseOrders';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const order = await getSupabaseOrderById(id);

    if (!order) {
      return NextResponse.json({ ok: false, message: 'Order not found' }, { status: 404 });
    }

    const isAdmin = requireAdmin(request);
    let safeOrder = { ...order };
    if (!isAdmin && safeOrder.address?.phone) {
      const raw = String(safeOrder.address.phone);
      safeOrder.address = {
        ...safeOrder.address,
        phone: raw.length > 5 ? raw.slice(0, 2) + '******' + raw.slice(-2) : raw,
      };
    }

    return NextResponse.json({ ok: true, order: safeOrder });
  } catch (error) {
    console.error('[Order Fetch Error]:', error);
    return NextResponse.json({ ok: false, message: 'Failed to fetch order' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!requireAdmin(request)) {
      return NextResponse.json({ ok: false, message: 'Admin authentication required' }, { status: 401 });
    }

    const existingOrder = await getSupabaseOrderById(id);
    if (!existingOrder) {
      return NextResponse.json({ ok: false, message: 'Order not found' }, { status: 404 });
    }

    const updatedOrder = await updateSupabaseOrder(id, body);
    if (!updatedOrder) {
      return NextResponse.json({ ok: false, message: 'Order update failed' }, { status: 500 });
    }

    let deliveryEmailSent = false;
    let deliveryEmailMessage = '';
    let statusNotificationSent = false;
    let statusNotificationMessage = '';
    const notificationStatuses = ['confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
    const statusChanged = body.status && body.status !== existingOrder.status;
    const notificationSent = existingOrder.statusNotificationSent?.[body.status];
    const shouldSendStatusNotification = statusChanged && notificationStatuses.includes(body.status) && !notificationSent;

    // Special delivery email with official Tax Bill & Cash Receipt
    if (body.status === 'delivered' && existingOrder.status !== 'delivered' && (existingOrder.customerEmail || existingOrder.address?.email || existingOrder.email)) {
      try {
        await sendDeliveryEmail({ ...existingOrder, ...body });
        await updateSupabaseOrder(id, {
          statusNotificationSent: {
            ...(existingOrder.statusNotificationSent || {}),
            delivered: new Date().toISOString(),
          },
        });
        deliveryEmailSent = true;
        statusNotificationSent = true;
      } catch (error) {
        deliveryEmailMessage = 'Delivery confirmation bill email send nahi ho paya.';
        console.error('[Delivery Email Error]:', error.message);
      }
    } else if (shouldSendStatusNotification && body.status !== 'delivered' && (existingOrder.customerEmail || existingOrder.address?.email || existingOrder.email)) {
      try {
        await sendOrderStatusEmail({ ...existingOrder, ...body }, body.status);
        await updateSupabaseOrder(id, {
          statusNotificationSent: {
            ...(existingOrder.statusNotificationSent || {}),
            [body.status]: new Date().toISOString(),
          },
        });
        statusNotificationSent = true;
      } catch (error) {
        statusNotificationMessage = 'Order update ho gaya, lekin customer notification email nahi bheja ja saka.';
        console.error('[Order Notification Error]:', error.message);
      }
    } else if (shouldSendStatusNotification) {
      statusNotificationMessage = 'Order update ho gaya, lekin customer email available nahi hai.';
    }

    return NextResponse.json({
      ok: true,
      order: updatedOrder,
      deliveryEmailSent,
      deliveryEmailMessage,
      statusNotificationSent,
      statusNotificationMessage,
      message: 'Order updated',
    });
  } catch (error) {
    console.error('[Order Update Error]:', error);
    return NextResponse.json({ ok: false, message: 'Order update failed' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ ok: false, message: 'Admin authentication required' }, { status: 401 });
  }

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ ok: false, message: 'Order ID is required' }, { status: 400 });
    }

    await deleteSupabaseOrder(id);
    return NextResponse.json({ ok: true, message: `Order ${id} deleted successfully` });
  } catch (error) {
    console.error('[Order Delete Error]:', error);
    return NextResponse.json({ ok: false, message: 'Order delete failed' }, { status: 500 });
  }
}
