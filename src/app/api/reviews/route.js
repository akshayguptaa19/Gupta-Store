import { NextResponse } from 'next/server';
import { getProductReviews, getAllReviews, addCustomerReview, deleteReview } from '@/lib/reviewsStore';
import { getSupabaseOrderById, getSupabaseOrders } from '@/lib/supabaseOrders';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const productName = searchParams.get('productName');

    if (productId || productName) {
      const reviews = await getProductReviews(productId, productName);
      const totalRating = reviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0);
      const avgRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 4.5;

      return NextResponse.json({
        ok: true,
        reviews,
        stats: {
          count: reviews.length,
          avgRating: Number(avgRating),
        },
      }, {
        headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' },
      });
    }

    const all = await getAllReviews();
    return NextResponse.json({ ok: true, reviews: all }, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' },
    });
  } catch (error) {
    console.error('[Reviews GET Error]:', error);
    return NextResponse.json({ ok: false, message: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { productId, productName, rating, comment, customerName, orderId, customerPhone, customerEmail } = body;

    const cleanComment = String(comment || '').replace(/[<>]/g, '').trim().slice(0, 1000);
    if (!cleanComment) {
      return NextResponse.json({ ok: false, message: 'Kripya apna feedback ya review comment likhein.' }, { status: 400 });
    }

    const cleanEmail = customerEmail ? String(customerEmail).trim().toLowerCase() : '';
    const cleanPhone = customerPhone ? String(customerPhone).replace(/\D/g, '').slice(-10) : '';

    if (!cleanEmail && !cleanPhone) {
      return NextResponse.json({
        ok: false,
        message: 'Review likhne ke liye verified customer login hona zaroori hai.',
      }, { status: 401 });
    }

    // STRICT VALIDATION: Only customers who bought THIS specific product and had it DELIVERED can review!
    let verifiedDeliveredOrder = null;

    function orderHasProduct(ord) {
      return (ord.items || []).some(it => {
        const idMatch = productId !== undefined && it.id !== undefined && String(it.id) === String(productId);
        const nameMatch = productName && it.name && it.name.trim().toLowerCase() === String(productName).trim().toLowerCase();
        return idMatch || nameMatch;
      });
    }

    function orderBelongsToCustomer(ord) {
      const ordEmail = String(ord.customerEmail || ord.address?.email || '').trim().toLowerCase();
      const ordPhone = String(ord.customerPhone || ord.address?.phone || '').replace(/\D/g, '').slice(-10);
      if (cleanEmail && ordEmail === cleanEmail) return true;
      if (cleanPhone && ordPhone === cleanPhone) return true;
      return false;
    }

    // 1. Check by orderId if passed
    if (orderId) {
      const foundOrder = await getSupabaseOrderById(orderId);
      if (foundOrder && orderBelongsToCustomer(foundOrder)) {
        if (foundOrder.status !== 'delivered') {
          return NextResponse.json({
            ok: false,
            message: 'Feedback sirf order deliver hone ke baad hi diya ja sakta hai. Aapka order abhi deliver nahi hua hai.',
          }, { status: 403 });
        }
        if (orderHasProduct(foundOrder)) {
          verifiedDeliveredOrder = foundOrder;
        }
      }
    }

    // 2. If not verified by orderId, search customer's past orders
    if (!verifiedDeliveredOrder) {
      const pastOrders = await getSupabaseOrders({
        phone: cleanPhone,
        email: cleanEmail,
      });

      const matchingDelivered = (pastOrders || []).find(ord => {
        return ord.status === 'delivered' && orderHasProduct(ord);
      });

      if (matchingDelivered) {
        verifiedDeliveredOrder = matchingDelivered;
      }
    }

    // If still not verified as a delivered customer of THIS product, strictly reject!
    if (!verifiedDeliveredOrder) {
      return NextResponse.json({
        ok: false,
        message: 'Review sirf wahi customer de sakte hain jinhone ye product order kiya ho aur jinka order successfully deliver ho chuka ho.',
      }, { status: 403 });
    }

    // Check duplicate review
    const existingReviews = await getProductReviews(productId, productName);
    const alreadyReviewed = existingReviews.some(r =>
      (r.orderId && r.orderId === verifiedDeliveredOrder.orderId) ||
      (cleanEmail && r.customerEmail && r.customerEmail.toLowerCase() === cleanEmail) ||
      (cleanPhone && r.customerPhone && r.customerPhone.slice(-10) === cleanPhone)
    );

    if (alreadyReviewed) {
      return NextResponse.json({
        ok: false,
        message: 'Aap is product ke liye pehle hi review de chuke hain. Dhanyawad!',
      }, { status: 400 });
    }

    const cleanName = String(verifiedDeliveredOrder.address?.name || verifiedDeliveredOrder.customerName || customerName || 'Verified Buyer').replace(/[<>]/g, '').trim().slice(0, 100);

    const newReview = await addCustomerReview({
      productId,
      productName,
      rating: Math.max(1, Math.min(5, Number(rating) || 5)),
      comment: cleanComment,
      customerName: cleanName,
      orderId: verifiedDeliveredOrder.orderId,
      customerEmail: cleanEmail,
      customerPhone: cleanPhone,
      location: verifiedDeliveredOrder.address?.area || 'Bakani',
      verifiedBuyer: true,
    });

    return NextResponse.json({
      ok: true,
      review: newReview,
      message: 'Aapka feedback safaltapoorvak submit ho gaya hai! 🎉',
    }, { status: 201 });
  } catch (error) {
    console.error('[Reviews POST Error]:', error);
    return NextResponse.json({ ok: false, message: 'Failed to submit review' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json({ ok: false, message: 'Unauthorized. Admin access required.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let reviewId = searchParams.get('id');

    if (!reviewId) {
      try {
        const body = await request.json();
        reviewId = body?.id || body?.reviewId;
      } catch {}
    }

    if (!reviewId) {
      return NextResponse.json({ ok: false, message: 'Review ID required' }, { status: 400 });
    }

    const deleted = await deleteReview(reviewId);
    return NextResponse.json({ ok: true, deleted, message: 'Review successfully removed' });
  } catch (error) {
    console.error('[Reviews DELETE Error]:', error);
    return NextResponse.json({ ok: false, message: 'Failed to delete review' }, { status: 500 });
  }
}

