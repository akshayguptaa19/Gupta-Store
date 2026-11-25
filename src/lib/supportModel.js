/**
 * Gupta General Store - Expert AI Customer Support & Problem Resolution Model
 * Trained on Bakani store policies, local delivery logistics, catalog, orders, and customer service.
 */

import { SHOP } from '@/lib/config';
import { getMergedProducts } from '@/lib/products';
import { formatCurrency, discountPct } from '@/lib/utils';

// Knowledge Base Configurations
export const STORE_KNOWLEDGE = {
  name: SHOP.name,
  tagline: SHOP.tagline,
  phone: SHOP.phone,
  whatsapp: SHOP.whatsapp,
  upiId: SHOP.upiId,
  address: SHOP.address,
  hours: 'Rozana (Saaton Din) Subah 8:00 AM se Raat 9:00 PM',
  delivery: {
    freeThreshold: 100,
    chargeBelowThreshold: 20,
    areas: 'Bakani town aur paas ke ilaqe (same-day doorstep delivery)',
    eta: '2 se 4 ghante ke andar (orders placed before 7:00 PM)',
  },
  replacementPolicy: {
    windowHours: 48,
    terms: 'Agar koi pen nahi chal rahi, notebook damaged hai ya galat item deliver ho gaya hai, toh 48 ghante me 100% free doorstep replacement milta hai.',
  },
  coupons: SHOP.couponCodes || {
    SAVE10: 10,
    SAVE20: 20,
    WELCOME: 15,
    GUPTA5: 5,
    NEWUSER: 30,
  },
};

/**
 * Normalizes input text for deep intent matching
 */
function normalizeQuery(text = '') {
  return String(text)
    .toLowerCase()
    .replace(/[^\w\s\u0900-\u097F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Main AI Support Engine: Resolves customer problems and inquiries
 */
export function generateSupportResponse({ message, orderContext = null, user = null }) {
  const rawMsg = String(message || '').trim();
  const q = normalizeQuery(rawMsg);

  // ── CASE 1: SPECIFIC ORDER CONTEXT IS ACTIVE ───────────────────────
  if (orderContext && orderContext.orderId) {
    const oId = orderContext.orderId;
    const items = orderContext.items || [];
    const itemNames = items.map(i => `${i.name || 'Item'} (x${i.qty || 1})`).join(', ');
    const total = orderContext.total || 0;
    const status = String(orderContext.status || 'placed').toLowerCase();
    const addressArea = orderContext.address?.area || orderContext.address?.address || 'Bakani';
    const isCod = orderContext.payment === 'cod' || !orderContext.payment;

    // A. "Kab aayega / Delivery kab hogi / Where is my order?"
    if (/(kab|aayega|status|kahan|tracking|track|delay|late|pahunch|deliver|time|eta)/.test(q)) {
      if (status === 'delivered') {
        return {
          text: `🎉 Aapka Order #${oId} safaltapoorvak deliver ho chuka hai!\n\n• Items: ${itemNames}\n• Amount: ₹${total} (${isCod ? 'Cash on Delivery' : 'Online Paid'})\n• Address: ${addressArea}\n\nAgar kisi item me koi problem hai toh hum replacement kar sakte hain.`,
          suggestions: ['Item damaged / kharab hai', 'Bill / Receipt chahiye', 'Dusra item order karna hai'],
          actions: [
            { label: '📄 View Receipt', type: 'navigate', url: `/track?orderId=${oId}` },
            { label: '⭐ Rate & Review', type: 'navigate', url: `/track?orderId=${oId}` },
          ],
        };
      }

      if (status === 'shipped') {
        return {
          text: `🚚 Order #${oId} Shipped ho chuka hai aur delivery boy raste me hai!\n\n• Delivery Location: ${addressArea}\n• Expected Time: Agle 1 se 2 ghante me\n• Total Pay: ₹${total} (${isCod ? 'COD cash ready rakhein' : 'Paid'})\n\nDelivery partner aapko call karke deliver karega.`,
          suggestions: ['Delivery boy ka number?', 'Cancel karna chahta hoon', 'Live Tracking dekhein'],
          actions: [
            { label: '🚚 Live Track Order', type: 'navigate', url: `/track?orderId=${oId}` },
            { label: '💬 WhatsApp Manager', type: 'whatsapp', url: `https://wa.me/${SHOP.whatsapp}?text=${encodeURIComponent(`Namaste Gupta Store, mera Order #${oId} shippped hai, delivery update chahiye.`)}` },
          ],
        };
      }

      if (status === 'packed' || status === 'confirmed') {
        return {
          text: `📦 Aapka Order #${oId} ${status === 'packed' ? 'pack ho chuka hai' : 'confirm ho gaya hai'}!\n\n• Items: ${itemNames}\n• Store Status: Dispatch ke liye ready ho raha hai\n• Delivery: Aaj hi ${addressArea} me deliver ho jayega.\n\nKuch hi der me delivery partner parcel lekar rawana hoga.`,
          suggestions: ['Address change karna hai', 'Order cancel karna hai', 'Aur item jodna hai'],
          actions: [
            { label: '🚚 Track Status', type: 'navigate', url: `/track?orderId=${oId}` },
          ],
        };
      }

      // Default 'placed'
      return {
        text: `📋 Order #${oId} store ko receive ho chuka hai aur confirmation queue me hai.\n\n• Items: ${itemNames}\n• Amount: ₹${total}\n• ETA: Aaj Bakani me fast delivery ho jayegi.\n\nAapko SMS/WhatsApp par delivery boy dispatch hote hi update milega.`,
        suggestions: ['Order cancel karna hai', 'Items change karne hain', 'Receipt chahiye'],
        actions: [
          { label: '🚚 Track Live', type: 'navigate', url: `/track?orderId=${oId}` },
        ],
      };
    }

    // B. "Cancel order / Cancel kaise karein"
    if (/(cancel|radd|rok|hatao|nahi chahiye|band karo)/.test(q)) {
      if (['placed', 'confirmed'].includes(status)) {
        return {
          text: `⚠️ Order #${oId} abhi pending stage me hai, isliye ise aasani se cancel kiya ja sakta hai.\n\nAap niche diye gaye button par click karke ya My Orders me jaakar 'Cancel Order' daba sakte hain.`,
          suggestions: ['Mera order cancel karo', 'Nahi, order aane do', 'Item change karna hai'],
          actions: [
            { label: '❌ Cancel This Order', type: 'cancel_order', orderId: oId },
            { label: '💬 WhatsApp par Cancel karein', type: 'whatsapp', url: `https://wa.me/${SHOP.whatsapp}?text=${encodeURIComponent(`Namaste Gupta Store, mujhe Order #${oId} cancel karwana hai.`)}` },
          ],
        };
      }

      return {
        text: `Order #${oId} ka status abhi "${status.toUpperCase()}" hai aur parcel nikal chuka hai.\n\nAgar aapko parcel nahi lena hai, toh delivery aane par delivery boy ko mana kar sakte hain, ya niche WhatsApp button se store manager se baat karein.`,
        suggestions: ['Delivery boy ko mana kar dunga', 'WhatsApp par baat karein'],
        actions: [
          { label: '💬 Store Manager se baat karein', type: 'whatsapp', url: `https://wa.me/${SHOP.whatsapp}?text=${encodeURIComponent(`Namaste, Order #${oId} cancel karna chahta hoon.`)}` },
        ],
      };
    }

    // C. "Damaged / Kharab / Defective / Wrong Item"
    if (/(damage|tuta|kharab|galat|wrong|chala nahi|ink|defective|faulty|replacement|replace|wapas)/.test(q)) {
      return {
        text: `🛡️ Chinta mat karein! Gupta Store ki 48-Hour Free Replacement Policy hai.\n\nOrder #${oId} ke kisi bhi damaged ya galat item ka hamara delivery boy 100% FREE replacement aapke ghar aakar dega.\n\nKripya item ki ek choti photo WhatsApp par share kar dein, hum turant replacement bhej denge:`,
        suggestions: ['Photo WhatsApp par bhej raha hoon', 'Replacement kab aayega?'],
        actions: [
          { label: '💬 Send Photo on WhatsApp', type: 'whatsapp', url: `https://wa.me/${SHOP.whatsapp}?text=${encodeURIComponent(`Namaste Gupta Store, Order #${oId} me item damaged/galat nikla hai. Ye photo hai, kripya replacement bhejein.`)}` },
          { label: '📞 Call Store directly', type: 'call', url: `tel:+918107615285` },
        ],
      };
    }

    // D. "Bill / Receipt / Invoice"
    if (/(bill|receipt|invoice|slip|rasid|parchi)/.test(q)) {
      return {
        text: `📄 Order #${oId} ka official bill aur receipt generate ho chuka hai.\n\n• Customer: ${orderContext.address?.name || user?.name || 'Customer'}\n• Total Billed: ₹${total}\n• Payment: ${isCod ? 'Cash on Delivery (COD)' : 'Prepaid Online'}\n\nAap niche button se turant receipt dekh aur print kar sakte hain:`,
        suggestions: ['Print receipt', 'Delivered hone par bill email aayega?'],
        actions: [
          { label: '📄 View & Print Receipt', type: 'navigate', url: `/track?orderId=${oId}` },
        ],
      };
    }

    // E. "Address / Mobile number change"
    if (/(address|pata|phone|number|mobile|badal|change)/.test(q)) {
      return {
        text: `📍 Current Delivery Address: ${orderContext.address?.name || ''}, ${addressArea} (Phone: ${orderContext.address?.phone || '-'})\n\nAgar address ya phone number me koi correction hai, toh delivery boy dispatch hone se pehle turant store team ko WhatsApp par sahi address bhej dein:`,
        suggestions: ['Sahi address WhatsApp par bhejta hoon', 'Order cancel karke naya karu?'],
        actions: [
          { label: '💬 Send Correct Address on WhatsApp', type: 'whatsapp', url: `https://wa.me/${SHOP.whatsapp}?text=${encodeURIComponent(`Namaste, Order #${oId} ka delivery address change karwana hai: `)}` },
        ],
      };
    }
  }

  // ── CASE 2: GENERAL SHOP & PRODUCT INTELLIGENCE ─────────────────────

  // 1. Greetings & Bot Intro
  if (/^(hi|hello|hey|namaste|namaskar|pranam|ram ram|hola|kaisa|kaise ho)/.test(q)) {
    return {
      text: `🙏 Namaste${user?.name ? ' ' + user.name : ''}! Main Gupta General Store Bakani ka AI Customer Support Assistant hoon.\n\nMain aapki in sabhi cheezon me madad kar sakta hoon:\n• 📦 Order tracking, cancellation aur receipt\n• 🛍️ Stationary products, prices aur stock inquiry\n• 🚚 Delivery timing, charges aur COD payment\n• 🔄 Damaged items ki 48-hr free replacement\n• 🎟️ Offers aur discount coupon codes\n\nBatayein aaj aapki kya sahayata kar sakta hoon?`,
      suggestions: ['Mera order track karein', 'Delivery charges kitne hain?', 'Sabse ache pens dikhao', 'Available discount coupons?'],
    };
  }

  // 2. Delivery & Shipping Policy
  if (/(delivery|shipping|charge|kitne me deliver|free delivery|kab tak milega|pahunch|charges)/.test(q)) {
    return {
      text: `🚚 **Gupta Store Delivery Details (Bakani):**\n\n• **FREE Delivery:** ₹${STORE_KNOWLEDGE.delivery.freeThreshold} ya usse zyada ke order par FREE delivery hai.\n• **Delivery Charge:** ₹${STORE_KNOWLEDGE.delivery.freeThreshold} se kam order par sirf ₹${STORE_KNOWLEDGE.delivery.chargeBelowThreshold} charge hai.\n• **Same-Day Delivery:** Bakani area me order karne ke 2 se 4 ghante ke andar doorstep deliver hota hai.\n• **Timings:** Subah 8:00 AM se Raat 9:00 PM tak deliveries chalti hain.`,
      suggestions: ['Cash on Delivery (COD) available hai?', 'Order track kaise karein?', 'Stationery items dikhao'],
      actions: [
        { label: '🛍️ Shop Now (Free Delivery ₹100+)', type: 'navigate', url: '/#products' },
      ],
    };
  }

  // 3. Payment Modes (COD, UPI, Paytm, GPay, PhonePe)
  if (/(payment|pay|cod|cash|upi|phonepe|gpay|paytm|online pay|card|net banking)/.test(q)) {
    return {
      text: `💵 **Payment Options:**\n\n1. **Cash on Delivery (COD):** 100% available! Jab delivery boy parcel de, tabhi cash pay karein.\n2. **UPI Payments:** PhonePe, Google Pay, Paytm accepted hain.\n   • Store UPI ID: \`${STORE_KNOWLEDGE.upiId}\`\n   • Delivery ke waqt delivery boy ke QR code par bhi scan karke pay kar sakte hain.\n3. **100% Secure & Trusted.**`,
      suggestions: ['Delivery charges kitne hain?', 'Orders me receipt kaise milegi?', 'Discounts kya hain?'],
    };
  }

  // 4. Return, Replacement & Damage Policy
  if (/(return|replace|replacement|damage|kharab|tuta|defective|faulty|galat item|exchange|wapsi)/.test(q)) {
    return {
      text: `🛡️ **48-Hour Hassle-Free Replacement Policy:**\n\n• Agar koi pen nahi chali, notebook me pages fate hain ya koi item defective hai, toh **48 ghante** ke andar hum **FREE doorstep replacement** karte hain.\n• Hamara delivery partner aapke ghar aakar naya item dekar jayega.\n• Bas WhatsApp (+91 ${STORE_KNOWLEDGE.phone.slice(2)}) par item ki photo bhej dein!`,
      suggestions: ['WhatsApp support se connect karein', 'Mera order track karein'],
      actions: [
        { label: '💬 WhatsApp Replacement Help', type: 'whatsapp', url: `https://wa.me/${SHOP.whatsapp}?text=${encodeURIComponent('Namaste Gupta Store, mujhe item replacement ke baare me baat karni hai.')}` },
      ],
    };
  }

  // 5. Coupons & Discount Codes
  if (/(coupon|discount|offer|promo|code|bachat|chhoot|kam price)/.test(q)) {
    const couponsList = Object.entries(STORE_KNOWLEDGE.coupons)
      .map(([code, val]) => `• **\`${code}\`** → ₹${val} Flat Discount`)
      .join('\n');

    return {
      text: `🎟️ **Active Gupta Store Discount Coupons:**\n\n${couponsList}\n\n💡 **Kaise Use Karein:** Cart page par jakar 'Apply Coupon' box me code enter karein aur Apply dabayein!`,
      suggestions: ['Cart me coupon lagayein', 'Free delivery kitne pe hai?'],
      actions: [
        { label: '🛒 Go to Cart', type: 'navigate', url: '/cart' },
      ],
    };
  }

  // 6. Store Timings, Address & Physical Location
  if (/(address|location|timing|time|hours|kahan hai|shop|store|dukan|open|close|band|khula|sunday|pata)/.test(q)) {
    return {
      text: `🏪 **Gupta General Store Details:**\n\n• **Address:** ${STORE_KNOWLEDGE.address}, Jhalawar (Raj.) - 326022\n• **Dukan Ka Samay:** ${STORE_KNOWLEDGE.hours}\n• **Phone:** +91 ${STORE_KNOWLEDGE.phone.slice(2)}\n• **WhatsApp:** wa.me/${STORE_KNOWLEDGE.whatsapp}\n\nBakani town ka sabse purana aur bharosemand stationery store!`,
      suggestions: ['Direct Call karein', 'WhatsApp par chat karein', 'Online Order karein'],
      actions: [
        { label: '📞 Call Store', type: 'call', url: `tel:+91${STORE_KNOWLEDGE.phone.slice(2)}` },
        { label: '💬 WhatsApp Chat', type: 'whatsapp', url: `https://wa.me/${STORE_KNOWLEDGE.whatsapp}` },
      ],
    };
  }

  // 7. Wholesale / Bulk Coaching / School Stationery
  if (/(bulk|wholesale|coaching|school supply|jyada|lot|register|50|100 piece|badi order)/.test(q)) {
    return {
      text: `📚 **Bulk & School/Coaching Orders:**\n\nHanji! Gupta General Store coaching institutes, schools aur bulk buyers ko special wholesale discounted rates deta hai.\n\nClassmate registers, exam pads, pens, whiteboard markers aur A4 paper rims par bulk discounts available hain. Direct store manager se deal ke liye sampark karein:`,
      suggestions: ['WhatsApp par quotation maangein', 'Call karke baat karein'],
      actions: [
        { label: '💬 Wholesale Quotation on WhatsApp', type: 'whatsapp', url: `https://wa.me/${SHOP.whatsapp}?text=${encodeURIComponent('Namaste Gupta Store, mujhe bulk/coaching stationery supplies ke liye wholesale price chahiye.')}` },
        { label: '📞 Call: +91 8107615285', type: 'call', url: 'tel:+918107615285' },
      ],
    };
  }

  // 8. Order Tracking General
  if (/(track|tracking|order kahan|mera order|status)/.test(q)) {
    return {
      text: `📦 **Order Live Tracking:**\n\nAap apne order ka real-time status (Placed ➔ Confirmed ➔ Packed ➔ Shipped ➔ Delivered) asani se dekh sakte hain:\n\n1. **My Orders** page par jayein.\n2. Apne order ke niche **'Track Live'** button par click karein.\n3. Wahan step-by-step timeline aur delivery receipt mil jayegi.`,
      suggestions: ['My Orders kholein', 'Direct Order ID se track karein'],
      actions: [
        { label: '📦 Open My Orders', type: 'navigate', url: '/profile#orders' },
        { label: '🚚 Track Page', type: 'navigate', url: '/track' },
      ],
    };
  }

  // 9. Catalog Product Search with live prices & stock
  const catalog = getMergedProducts();
  const scored = catalog
    .map(p => {
      let score = 0;
      const pName = (p.name || '').toLowerCase();
      const pCat = (p.category || '').toLowerCase();
      const pDesc = (p.desc || '').toLowerCase();

      const words = q.split(' ').filter(w => w.length > 2);
      for (const w of words) {
        if (pName.includes(w)) score += 5;
        if (pCat.includes(w)) score += 3;
        if (pDesc.includes(w)) score += 1;
      }
      return { p, score };
    })
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length > 0) {
    const top = scored.slice(0, 3);
    const best = top[0].p;
    const discount = discountPct(best.price, best.mrp);
    const stockStatus = Number(best.stock) > 0 ? `In Stock (${best.stock} pieces)` : 'Out of Stock';

    const otherItems = top.length > 1
      ? '\n\n**Aapke sawal se related anya items:**\n' + top.slice(1).map(x => `• ${x.p.name} — ${formatCurrency(x.p.price)}`).join('\n')
      : '';

    return {
      text: `🛍️ **${best.name}**\n\n• **Price:** ${formatCurrency(best.price)} ${discount > 0 ? `(₹${best.mrp} par ${discount}% OFF)` : ''}\n• **Availability:** ${stockStatus}\n• **Description:** ${best.desc || 'Gupta Store verified authentic stationery.'}${otherItems}\n\nIse aap direct cart me add karke COD par order kar sakte hain!`,
      suggestions: ['Free delivery kitne pe hai?', 'COD order kaise karein?', 'Any discount coupon?'],
      actions: [
        { label: '🛍️ View Products', type: 'navigate', url: '/#products' },
      ],
    };
  }

  // 10. Human / Store Manager Escalation
  if (/(baat karni|insaan|human|manager|owner|call|sampark|contact|help desk|madad)/.test(q)) {
    return {
      text: `👨‍💼 **Store Manager Direct Support:**\n\nAap directly hamare store manager M.S. Gupta ji se phone ya WhatsApp par baat kar sakte hain:\n\n• **Mobile:** +91 8107615285\n• **WhatsApp:** wa.me/918107615285\n• **Store:** Gupta General Store, Main Market, Bakani`,
      suggestions: ['WhatsApp par connect karein', 'Direct Call karein'],
      actions: [
        { label: '💬 WhatsApp Store Manager', type: 'whatsapp', url: `https://wa.me/${SHOP.whatsapp}?text=${encodeURIComponent('Namaste Gupta Store, mujhe customer care support chahiye.')}` },
        { label: '📞 Call +91 8107615285', type: 'call', url: 'tel:+918107615285' },
      ],
    };
  }

  // 11. Smart Comprehensive Fallback
  return {
    text: `Main samajh gaya! Aap Gupta General Store se sambandhit in vishayon par poochh sakte hain:\n\n• **Order Status:** "Mera order kab aayega?", "Order cancel karna hai"\n• **Products & Prices:** "Classmate notebook price", "Ball pen dikhao"\n• **Delivery & Payment:** "COD available hai?", "Delivery charge kitna hai?"\n• **Returns:** "Damaged item replacement policy"\n• **Discounts:** "Available coupon codes"`,
    suggestions: ['Mera order track karein', 'Delivery charges?', 'Available coupons', 'Store Manager se baat karein'],
    actions: [
      { label: '💬 WhatsApp par Poochhein', type: 'whatsapp', url: `https://wa.me/${SHOP.whatsapp}?text=${encodeURIComponent(`Namaste Gupta Store, mujhe yeh jankari chahiye: ${rawMsg}`)}` },
    ],
  };
}

