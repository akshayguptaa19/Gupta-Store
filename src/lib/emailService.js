import nodemailer from 'nodemailer';

/**
 * Checks if real email service credentials are configured in .env.local
 */
export function isEmailConfigured() {
  return Boolean(
    (process.env.EMAIL_USER && process.env.EMAIL_PASS) ||
    (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) ||
    process.env.RESEND_API_KEY
  );
}

/**
 * Creates and returns the nodemailer transporter based on environment variables
 */
function getTransporter() {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Google App Password (16 characters)
      },
    });
  }

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const port = Number(process.env.SMTP_PORT) || 587;
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return null;
}

/**
 * Generates an elegant, professional HTML template for the OTP email
 */
function getOtpEmailHtml(otp, options = {}) {
  const mode = options.mode || 'login';
  const name = options.name ? String(options.name).trim() : '';

  let heading = 'Login / Verification Code';
  let subText = 'Aapke account verification ke liye ye 6-digit code hai:';
  let badgeText = '🔐 ACCOUNT VERIFICATION';

  if (mode === 'register') {
    heading = 'Verify Your Email Address';
    subText = `Namaste${name ? ' ' + name : ''}! Gupta Store me aapka swagat hai. Apna naya account activate karne ke liye niche diya gaya 6-digit OTP code enter karein:`;
    badgeText = '🎉 NEW ACCOUNT REGISTRATION';
  } else if (mode === 'reset_password') {
    heading = 'Reset Your Password';
    subText = 'Aapke Gupta Store account ka password reset karne ke liye verification code:';
    badgeText = '🔑 PASSWORD RECOVERY';
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gupta Store Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 500px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 30px 20px; text-align: center;">
              <div style="display: inline-block; background: rgba(249,115,22,0.15); border: 1px solid rgba(249,115,22,0.4); padding: 4px 14px; border-radius: 20px; color: #fb923c; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 10px;">
                ${badgeText}
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">
                🛒 Gupta <span style="color: #f97316;">Store</span>
              </h1>
              <p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 13px; font-weight: 500;">
                Bakani ka #1 Stationery & Essentials Store
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 35px 30px; text-align: center;">
              <h2 style="margin: 0 0 12px 0; color: #0f172a; font-size: 22px; font-weight: 800;">
                ${heading}
              </h2>
              <p style="margin: 0 0 25px 0; color: #475569; font-size: 14px; line-height: 1.6;">
                ${subText}
              </p>

              <!-- OTP Code Box -->
              <div style="background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border: 2px dashed #f97316; border-radius: 14px; padding: 20px 24px; margin: 0 auto 25px auto; display: inline-block;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 900; color: #ea580c; letter-spacing: 10px; margin-right: -10px;">
                  ${otp}
                </span>
              </div>

              <div style="background-color: #f8fafc; border-radius: 10px; padding: 12px 16px; margin-bottom: 20px; border: 1px solid #e2e8f0; display: inline-block;">
                <p style="margin: 0; color: #0f172a; font-size: 13px; font-weight: 600;">
                  ⏱️ Yeh OTP agle <strong>5 minute</strong> ke liye valid hai.
                </p>
              </div>

              <p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.5;">
                🔒 Suraksha Suvidha: Gupta Store team aap se kabhi phone ya message par OTP nahi mangti. Kripya is code ko kisi ke sath share na karein.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 22px 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 6px 0; color: #475569; font-size: 12px; font-weight: 700;">
                Gupta General Store • Main Market, Bakani (Jhalawar, Rajasthan)
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 11px;">
                School, College, Office Stationery & Daily Essentials • Fast Local Delivery
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generates an elegant HTML template for the Welcome email
 */
function getWelcomeEmailHtml(name) {
  const safeName = name ? String(name).trim() : 'Customer';
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Gupta Store</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;">
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 30px 20px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 800;">
                🎉 Welcome to Gupta <span style="color: #f97316;">Store</span>!
              </h1>
              <p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 13px;">
                Aapka account safaltapoorvak verify ho gaya hai.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px 25px;">
              <h2 style="margin: 0 0 10px 0; color: #0f172a; font-size: 18px; font-weight: 700;">
                Namaste ${safeName}! 👋
              </h2>
              <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                Gupta Store family me judne ke liye dhanyawad! Ab aap Bakani ki sabse bharosemand stationery shop se asani se shopping kar sakte hain.
              </p>

              <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 16px; margin-bottom: 25px;">
                <h4 style="margin: 0 0 10px 0; color: #c2410c; font-size: 14px; font-weight: 700;">
                  ⭐ Aapke Faayde:
                </h4>
                <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 13px; line-height: 1.8;">
                  <li><strong>Fast Local Delivery:</strong> Seedhe aapke ghar tak quick delivery.</li>
                  <li><strong>100% Original Products:</strong> Classmate, Reynolds, Camlin, Doms aur bhi bahut kuch.</li>
                  <li><strong>Easy Payment:</strong> Cash on Delivery (COD) aur UPI online payments.</li>
                  <li><strong>Live Order Tracking:</strong> Har order ka live status check karein.</li>
                </ul>
              </div>

              <div style="text-align: center;">
                <a href="https://guptastore.in" style="background-color: #ea580c; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 15px; padding: 12px 28px; border-radius: 10px; display: inline-block;">
                  🛍️ Start Shopping Now
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #64748b; font-size: 12px;">
                Gupta General Store • Main Market, Bakani (Jhalawar) • +91 81076 15285
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Sends real OTP email to the recipient with options (mode, name)
 */
export async function sendOtpEmail(toEmail, otp, options = {}) {
  const cleanEmail = String(toEmail || '').trim().toLowerCase();
  const mode = options?.mode || 'login';

  let subject = `🔐 ${otp} - Gupta Store Verification Code`;
  if (mode === 'register') {
    subject = `🎉 ${otp} - Verify your email for Gupta Store`;
  } else if (mode === 'reset_password') {
    subject = `🔑 ${otp} - Password reset code for Gupta Store`;
  }

  // Prefer Gmail SMTP when its credentials are configured.
  const transporter = getTransporter();
  if (transporter) {
    const sender = process.env.EMAIL_FROM || `Gupta General Store <${process.env.EMAIL_USER}>`;
    const info = await transporter.sendMail({
      from: sender,
      to: cleanEmail,
      subject,
      text: `Your Gupta Store verification code is ${otp}. Valid for 5 minutes. Please do not share it.`,
      html: getOtpEmailHtml(otp, options),
    });
    return { success: true, messageId: info.messageId, provider: 'smtp' };
  }

  if (process.env.RESEND_API_KEY) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'Gupta Store <onboarding@resend.dev>',
        to: [cleanEmail],
        subject,
        html: getOtpEmailHtml(otp, options),
      }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Resend email sending failed');
    }
    return { success: true, provider: 'resend' };
  }

  throw new Error('Email service not configured. Please set Gmail EMAIL_USER and EMAIL_PASS in .env.local.');
}

/**
 * Sends a welcome email upon successful account registration & email verification
 */
export async function sendWelcomeEmail(toEmail, name) {
  const cleanEmail = String(toEmail || '').trim().toLowerCase();
  const transporter = getTransporter();
  if (transporter) {
    const sender = process.env.EMAIL_FROM || `Gupta General Store <${process.env.EMAIL_USER}>`;
    await transporter.sendMail({
      from: sender,
      to: cleanEmail,
      subject: `🎉 Welcome to Gupta Store, ${name || 'Customer'}!`,
      text: `Welcome to Gupta Store! Your account has been verified successfully. Start shopping quality stationery at Gupta Store.`,
      html: getWelcomeEmailHtml(name),
    });
    return { success: true };
  }
}


function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  }[character]));
}

/**
 * Generates a world-class, professional HTML email for "Order Successfully Placed"
 */
function getOrderPlacedEmailHtml(order) {
  const customerName = escapeHtml(order.address?.name || order.customerName || 'Valued Customer');
  const delivery = order.expectedDelivery?.dateLabel
    ? `${escapeHtml(order.expectedDelivery.weekday)}, ${escapeHtml(order.expectedDelivery.dateLabel)}`
    : 'Kal 9:00 PM tak • Doorstep in Bakani';
  const subtotal = order.sub || order.total || 0;
  const deliveryCharge = Number(order.delivery || 0);
  const discount = Number(order.discount || 0);
  const total = Number(order.total || 0);

  const itemsHtml = (order.items || []).map((item, idx) => `
    <tr>
      <td style="padding: 12px 10px; border-bottom: 1px solid #f1f5f9; vertical-align: middle;">
        <div style="font-weight: 700; color: #0f172a; font-size: 14px; margin-bottom: 2px;">
          ${escapeHtml(item.name)}
        </div>
        <div style="font-size: 12px; color: #64748b;">
          Unit Price: ₹${Number(item.price || 0).toLocaleString('en-IN')}
        </div>
      </td>
      <td style="padding: 12px 10px; border-bottom: 1px solid #f1f5f9; text-align: center; vertical-align: middle;">
        <span style="display: inline-block; padding: 3px 9px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-weight: 700; font-size: 13px; color: #334155;">
          ${item.qty}
        </span>
      </td>
      <td style="padding: 12px 10px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 800; color: #0f172a; font-size: 14px; vertical-align: middle;">
        ₹${Number(item.price * item.qty).toLocaleString('en-IN')}
      </td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Placed Successfully #${escapeHtml(order.orderId)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 620px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          
          <!-- Top Brand Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 24px; text-align: center;">
              <div style="display: inline-block; background: rgba(249,115,22,0.18); border: 1px solid rgba(249,115,22,0.4); padding: 5px 16px; border-radius: 999px; color: #fb923c; font-size: 11px; font-weight: 800; letter-spacing: 0.6px; margin-bottom: 12px; text-transform: uppercase;">
                🎉 ORDER PLACED SUCCESSFULLY
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">
                🛒 Gupta <span style="color: #f97316;">Store</span>
              </h1>
              <p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 13px; font-weight: 500;">
                Main Market, Bakani (Jhalawar) • Fast Local Doorstep Delivery
              </p>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 35px 30px;">
              <h2 style="margin: 0 0 8px 0; color: #0f172a; font-size: 20px; font-weight: 800;">
                Namaste ${customerName}! 👋
              </h2>
              <p style="margin: 0 0 24px 0; color: #475569; font-size: 14px; line-height: 1.6;">
                Aapka order <strong>#${escapeHtml(order.orderId)}</strong> safaltapoorvak place ho gaya hai! Hamari team packaging check karke ise dispatch karegi.
              </p>

              <!-- Order Summary Meta Card -->
              <table width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px 20px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; color: #64748b;">Order ID:</td>
                  <td style="padding: 4px 0; font-size: 14px; font-weight: 800; color: #ea580c; text-align: right;">#${escapeHtml(order.orderId)}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; color: #64748b;">Order Date:</td>
                  <td style="padding: 4px 0; font-size: 13px; font-weight: 700; color: #0f172a; text-align: right;">${new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; color: #64748b;">Payment Mode:</td>
                  <td style="padding: 4px 0; font-size: 13px; font-weight: 700; color: #16a34a; text-align: right;">💵 Cash on Delivery (Pay at Doorstep)</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; color: #64748b;">Expected Delivery:</td>
                  <td style="padding: 4px 0; font-size: 13px; font-weight: 700; color: #0f172a; text-align: right;">${delivery}</td>
                </tr>
              </table>

              <!-- Ordered Items Table -->
              <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
                Ordered Stationery Items (${order.items?.length || 0})
              </h3>
              <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #f8fafc;">
                    <th style="padding: 10px 10px; text-align: left; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Product</th>
                    <th style="padding: 10px 10px; text-align: center; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Qty</th>
                    <th style="padding: 10px 10px; text-align: right; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <!-- Bill Breakdown Card -->
              <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 28px; font-size: 14px;">
                <tr>
                  <td style="padding: 5px 0; color: #64748b;">Items Subtotal</td>
                  <td style="padding: 5px 0; text-align: right; font-weight: 700; color: #0f172a;">₹${subtotal.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #64748b;">Delivery Fee</td>
                  <td style="padding: 5px 0; text-align: right; font-weight: 700; color: ${deliveryCharge === 0 ? '#16a34a' : '#0f172a'};">
                    ${deliveryCharge === 0 ? 'FREE (Bakani Area)' : `₹${deliveryCharge.toLocaleString('en-IN')}`}
                  </td>
                </tr>
                ${discount > 0 ? `
                <tr>
                  <td style="padding: 5px 0; color: #16a34a; font-weight: 700;">Coupon Discount (${escapeHtml(order.coupon || 'PROMO')})</td>
                  <td style="padding: 5px 0; text-align: right; font-weight: 700; color: #16a34a;">-₹${discount.toLocaleString('en-IN')}</td>
                </tr>` : ''}
                <tr>
                  <td style="padding: 14px 0 0 0; border-top: 2px solid #e2e8f0; font-size: 16px; font-weight: 900; color: #0f172a;">
                    Total Payable Amount
                  </td>
                  <td style="padding: 14px 0 0 0; border-top: 2px solid #e2e8f0; text-align: right; font-size: 20px; font-weight: 900; color: #ea580c;">
                    ₹${total.toLocaleString('en-IN')}
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 4px 0 0 0; text-align: right; font-size: 11px; color: #94a3b8;">
                    (Cash on Delivery: Payment delivery ke samay deni hai)
                  </td>
                </tr>
              </table>

              <!-- Delivery Address Box -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; margin-bottom: 28px;">
                <div style="font-size: 11px; font-weight: 800; color: #ea580c; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
                  📍 DELIVERY ADDRESS
                </div>
                <div style="font-weight: 800; font-size: 14px; color: #0f172a;">${customerName}</div>
                <div style="font-size: 13px; color: #475569; margin-top: 2px;">
                  ${escapeHtml(order.address?.area || 'Bakani')}
                  ${order.address?.pincode ? ` - ${escapeHtml(order.address.pincode)}` : ''}
                </div>
                <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
                  📞 Phone: +91 ${escapeHtml(order.address?.phone || order.customerPhone || 'N/A')}
                </div>
              </div>

              <!-- Action Links / Buttons -->
              <div style="text-align: center; margin-bottom: 10px;">
                <a href="https://guptastore.in/track?orderId=${encodeURIComponent(order.orderId)}" style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; text-decoration: none; font-weight: 800; font-size: 15px; padding: 14px 32px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 14px rgba(249, 115, 22, 0.35);">
                  🚚 Track Your Order Live
                </a>
              </div>
            </td>
          </tr>

          <!-- Store Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 6px 0; color: #0f172a; font-size: 13px; font-weight: 800;">
                Gupta General Store • Main Market, Bakani (Jhalawar, Rajasthan)
              </p>
              <p style="margin: 0 0 10px 0; color: #64748b; font-size: 12px;">
                Questions? WhatsApp ya Call karein: <strong>+91 81076 15285</strong>
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 11px;">
                1990 se Bakani ki seva mein • Best Quality Stationery Guaranteed
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generates an executive, official Tax Bill / Delivery Receipt email when an order is DELIVERED
 */
function getDeliveryEmailHtml(order) {
  const customerName = escapeHtml(order.address?.name || order.customerName || 'Valued Customer');
  const subtotal = order.sub || order.total || 0;
  const deliveryCharge = Number(order.delivery || 0);
  const discount = Number(order.discount || 0);
  const total = Number(order.total || 0);
  const invoiceNo = `INV-${escapeHtml(order.orderId)}`;
  const deliveryDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const items = (order.items || []).map((item, idx) => `
    <tr>
      <td style="padding: 12px 10px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: 700; font-size: 13px;">
        ${idx + 1}. ${escapeHtml(item.name)}
      </td>
      <td style="padding: 12px 10px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #475569; font-weight: 700; font-size: 13px;">
        ${item.qty}
      </td>
      <td style="padding: 12px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #475569; font-size: 13px;">
        ₹${Number(item.price || 0).toLocaleString('en-IN')}
      </td>
      <td style="padding: 12px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 800; color: #0f172a; font-size: 14px;">
        ₹${Number(item.price * item.qty).toLocaleString('en-IN')}
      </td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Delivered & Official Bill #${invoiceNo}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 620px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.07); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #064e3b 0%, #0f172a 100%); padding: 32px 24px; text-align: center;">
              <div style="display: inline-block; background: rgba(34,197,94,0.2); border: 1px solid rgba(34,197,94,0.4); padding: 5px 16px; border-radius: 999px; color: #4ade80; font-size: 11px; font-weight: 800; letter-spacing: 0.6px; margin-bottom: 12px; text-transform: uppercase;">
                ✓ ORDER DELIVERED • OFFICIAL BILL & CASH RECEIPT
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">
                🛒 Gupta <span style="color: #22c55e;">Store</span>
              </h1>
              <p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 13px;">
                Gupta General Store • Main Market, Bakani (Jhalawar) - 326022
              </p>
            </td>
          </tr>

          <!-- Delivered Announcement & Bill Details -->
          <tr>
            <td style="padding: 35px 30px;">
              
              <!-- Celebration Card -->
              <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 1.5px solid #86efac; border-radius: 14px; padding: 18px 20px; margin-bottom: 24px; text-align: center;">
                <div style="font-size: 26px; margin-bottom: 4px;">🎉</div>
                <h2 style="margin: 0 0 6px 0; color: #166534; font-size: 19px; font-weight: 900;">
                  Order Delivered Successfully!
                </h2>
                <p style="margin: 0; color: #15803d; font-size: 13px; line-height: 1.5;">
                  Aapka order <strong>#${escapeHtml(order.orderId)}</strong> deliver kar diya gaya hai aur Cash Payment safaltapoorvak receive ho chuka hai.
                </p>
              </div>

              <!-- Official Invoice Header -->
              <table width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 18px; margin-bottom: 24px;">
                <tr>
                  <td style="font-size: 12px; color: #64748b; padding: 3px 0;">Invoice Number:</td>
                  <td style="font-size: 13px; font-weight: 800; color: #0f172a; text-align: right; padding: 3px 0;">${invoiceNo}</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; color: #64748b; padding: 3px 0;">Order ID:</td>
                  <td style="font-size: 13px; font-weight: 800; color: #ea580c; text-align: right; padding: 3px 0;">#${escapeHtml(order.orderId)}</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; color: #64748b; padding: 3px 0;">Delivered On:</td>
                  <td style="font-size: 13px; font-weight: 700; color: #0f172a; text-align: right; padding: 3px 0;">${deliveryDate}</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; color: #64748b; padding: 3px 0;">Payment Settlement:</td>
                  <td style="font-size: 13px; font-weight: 800; color: #16a34a; text-align: right; padding: 3px 0;">
                    ✓ PAID IN FULL (Cash on Delivery)
                  </td>
                </tr>
                <tr>
                  <td style="font-size: 12px; color: #64748b; padding: 3px 0;">Delivered To:</td>
                  <td style="font-size: 13px; font-weight: 700; color: #0f172a; text-align: right; padding: 3px 0;">
                    ${customerName}, ${escapeHtml(order.address?.area || 'Bakani')}
                  </td>
                </tr>
              </table>

              <!-- Itemized Invoice Table -->
              <h3 style="margin: 0 0 10px 0; font-size: 13px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
                Itemized Tax Invoice Breakdown
              </h3>
              <table width="100%" cellspacing="0" cellpadding="0" style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 22px;">
                <thead>
                  <tr style="background-color: #f8fafc;">
                    <th style="padding: 10px; text-align: left; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Item Description</th>
                    <th style="padding: 10px; text-align: center; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Qty</th>
                    <th style="padding: 10px; text-align: right; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Rate</th>
                    <th style="padding: 10px; text-align: right; font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${items}
                </tbody>
              </table>

              <!-- Bill Totals -->
              <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 28px; font-size: 14px;">
                <tr>
                  <td style="padding: 5px 0; color: #64748b;">Subtotal</td>
                  <td style="padding: 5px 0; text-align: right; font-weight: 700; color: #0f172a;">₹${subtotal.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #64748b;">Delivery Charge</td>
                  <td style="padding: 5px 0; text-align: right; font-weight: 700; color: #16a34a;">
                    ${deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge.toLocaleString('en-IN')}`}
                  </td>
                </tr>
                ${discount > 0 ? `
                <tr>
                  <td style="padding: 5px 0; color: #16a34a; font-weight: 700;">Discount</td>
                  <td style="padding: 5px 0; text-align: right; font-weight: 700; color: #16a34a;">-₹${discount.toLocaleString('en-IN')}</td>
                </tr>` : ''}
                <tr>
                  <td style="padding: 14px 0 0 0; border-top: 2px solid #e2e8f0; font-size: 17px; font-weight: 900; color: #0f172a;">
                    Grand Total Paid
                  </td>
                  <td style="padding: 14px 0 0 0; border-top: 2px solid #e2e8f0; text-align: right; font-size: 22px; font-weight: 900; color: #16a34a;">
                    ₹${total.toLocaleString('en-IN')}
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 4px 0 0 0; text-align: right; font-size: 11px; color: #64748b;">
                    (Inclusive of all taxes & local delivery fees)
                  </td>
                </tr>
              </table>

              <!-- Buy Again / Support Actions -->
              <div style="text-align: center; margin-bottom: 12px;">
                <a href="https://guptastore.in" style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: #ffffff; text-decoration: none; font-weight: 800; font-size: 14px; padding: 13px 28px; border-radius: 12px; display: inline-block; margin-right: 8px;">
                  🛍️ Order Again from Gupta Store
                </a>
              </div>
            </td>
          </tr>

          <!-- Official Stamp & Sign-off Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 6px 0; color: #0f172a; font-size: 13px; font-weight: 800;">
                Gupta General Store • Main Market, Bakani (Jhalawar, Rajasthan)
              </p>
              <p style="margin: 0 0 8px 0; color: #64748b; font-size: 12px;">
                Authorized computer-generated tax invoice. Kripya ise apne records ke liye save karein.
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 11px;">
                Thank you for choosing Gupta Store Bakani!
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendDeliveryEmail(order) {
  const cleanEmail = String(order?.customerEmail || order?.address?.email || order?.email || '').trim().toLowerCase();
  if (!cleanEmail) throw new Error('Customer email is missing from the order.');

  const subject = `✅ Order Delivered & Official Bill: #${order.orderId} | Gupta Store Bakani`;
  const html = getDeliveryEmailHtml(order);
  const transporter = getTransporter();
  if (transporter) {
    const sender = process.env.EMAIL_FROM || `Gupta General Store <${process.env.EMAIL_USER}>`;
    const info = await transporter.sendMail({
      from: sender,
      to: cleanEmail,
      subject,
      text: `Namaste! Aapka order #${order.orderId} successfully deliver ho gaya hai. Total bill: Rs. ${order.total || 0}. Thank you for shopping with Gupta Store Bakani.`,
      html,
    });
    return { success: true, messageId: info.messageId, provider: 'smtp' };
  }

  if (process.env.RESEND_API_KEY) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.EMAIL_FROM || 'Gupta Store <onboarding@resend.dev>', to: [cleanEmail], subject, html }),
    });
    if (!res.ok) throw new Error('Delivery email provider failed.');
    return { success: true, provider: 'resend' };
  }

  throw new Error('Email service not configured.');
}

const ORDER_NOTIFICATION_COPY = {
  placed: {
    icon: '🎉', title: 'Order Placed Successfully', color: '#ea580c',
    message: 'Aapka order successfully place ho gaya hai. Hamari team packaging check karke jaldi dispatch karegi.',
  },
  confirmed: {
    icon: '✅', title: 'Order Confirmed', color: '#2563eb',
    message: 'Aapka order confirm ho gaya hai aur ab hamari team ise process kar rahi hai.',
  },
  packed: {
    icon: '📦', title: 'Your Order is Packed', color: '#d97706',
    message: 'Aapka order carefully pack kiya ja chuka hai. Jaldi hi local delivery ke liye nikal raha hai.',
  },
  shipped: {
    icon: '🚚', title: 'Your Order is Dispatched', color: '#ea580c',
    message: 'Aapka order Gupta Store counter se dispatch ho gaya hai aur aapke address ki taraf aa raha hai.',
  },
  out_for_delivery: {
    icon: '🚴', title: 'Your Order is Out for Delivery', color: '#ea580c',
    message: 'Aapka order aaj aapke doorstep delivery ke liye nikal chuka hai. Kripya phone available rakhein.',
  },
  delivered: {
    icon: '✓', title: 'Order Delivered Successfully', color: '#16a34a',
    message: 'Aapka order successfully deliver ho gaya hai. Gupta Store ke saath shopping karne ke liye thank you!',
  },
};

function getOrderNotificationHtml(order, status) {
  if (status === 'placed') {
    return getOrderPlacedEmailHtml(order);
  }
  if (status === 'delivered') {
    return getDeliveryEmailHtml(order);
  }

  const copy = ORDER_NOTIFICATION_COPY[status] || ORDER_NOTIFICATION_COPY.placed;
  const items = (order.items || []).map(item => `
    <tr>
      <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;color:#334155;font-weight:600;">${escapeHtml(item.name)}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:center;color:#64748b;">${item.qty}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;color:#0f172a;">₹${Number(item.price * item.qty).toLocaleString('en-IN')}</td>
    </tr>`).join('');
  const delivery = order.expectedDelivery?.dateLabel ? `${order.expectedDelivery.weekday}, ${order.expectedDelivery.dateLabel}` : 'Kal 9:00 PM tak • Bakani delivery';

  return `<!DOCTYPE html><html><body style="margin:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;"><table width="100%" cellpadding="0" cellspacing="0" style="padding:28px 12px;background:#f8fafc;"><tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;box-shadow:0 10px 25px rgba(0,0,0,0.06);border:1px solid #e2e8f0;"><tr><td style="padding:26px 20px;text-align:center;background:#0f172a;color:#fff;"><div style="font-size:24px;font-weight:900;">Gupta <span style="color:#f97316;">Store</span></div><div style="margin-top:6px;color:#cbd5e1;font-size:13px;">Live Order Dispatch Notification • Bakani</div></td></tr><tr><td style="padding:30px 26px;"><div style="font-size:22px;font-weight:800;margin-bottom:8px;color:${copy.color};">${copy.icon} ${copy.title}</div><p style="color:#475569;line-height:1.6;margin:0 0 20px;">Namaste ${escapeHtml(order.address?.name || 'Customer')}, ${copy.message}</p><div style="padding:14px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:20px;"><strong>Order ID:</strong> #${escapeHtml(order.orderId)}<br/><span style="display:inline-block;margin-top:5px;color:${copy.color};font-weight:700;">Status: ${escapeHtml(copy.title)}</span></div><table width="100%" cellpadding="0" cellspacing="0"><thead><tr style="background:#f8fafc;"><th style="padding:8px;text-align:left;font-size:11px;color:#64748b;">ITEM</th><th style="padding:8px;text-align:center;font-size:11px;color:#64748b;">QTY</th><th style="padding:8px;text-align:right;font-size:11px;color:#64748b;">AMOUNT</th></tr></thead><tbody>${items}</tbody></table><table width="100%" style="margin-top:16px;"><tr><td style="padding:5px 0;color:#64748b;">Expected delivery</td><td style="padding:5px 0;text-align:right;font-weight:700;">${escapeHtml(delivery)}</td></tr><tr><td style="padding:10px 0 0;border-top:2px solid #e2e8f0;font-size:17px;font-weight:800;">Order total</td><td style="padding:10px 0 0;border-top:2px solid #e2e8f0;text-align:right;font-size:18px;font-weight:800;color:#16a34a;">₹${Number(order.total || 0).toLocaleString('en-IN')}</td></tr></table><div style="text-align:center;margin-top:25px;"><a href="https://guptastore.in/track?orderId=${encodeURIComponent(order.orderId)}" style="background:#ea580c;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:10px;display:inline-block;">🚚 Track Live Status</a></div></td></tr><tr><td style="padding:18px;text-align:center;background:#f8fafc;color:#64748b;font-size:12px;border-top:1px solid #e2e8f0;">Gupta General Store • Main Market, Bakani (Jhalawar) • +91 81076 15285</td></tr></table></td></tr></table></body></html>`.trim();
}

export async function sendOrderStatusEmail(order, status) {
  const cleanEmail = String(order?.customerEmail || order?.address?.email || order?.email || '').trim().toLowerCase();
  if (!cleanEmail) throw new Error('Customer email is missing from the order.');

  let subject = `${order.orderId} Status Update | Gupta Store`;
  if (status === 'placed') {
    subject = `🎉 Order Placed Successfully: #${order.orderId} | Gupta Store Bakani`;
  } else if (status === 'delivered') {
    subject = `✅ Order Delivered & Official Bill: #${order.orderId} | Gupta Store Bakani`;
  } else {
    const copy = ORDER_NOTIFICATION_COPY[status] || ORDER_NOTIFICATION_COPY.placed;
    subject = `${copy.icon} ${copy.title}: #${order.orderId} | Gupta Store`;
  }

  const html = getOrderNotificationHtml(order, status);
  const text = `Order #${order.orderId}: Status is now ${status}. Total: Rs. ${order.total || 0}. Gupta General Store Bakani.`;
  const transporter = getTransporter();

  if (transporter) {
    const sender = process.env.EMAIL_FROM || `Gupta General Store <${process.env.EMAIL_USER}>`;
    const info = await transporter.sendMail({ from: sender, to: cleanEmail, subject, text, html });
    return { success: true, messageId: info.messageId, provider: 'smtp' };
  }

  if (process.env.RESEND_API_KEY) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.EMAIL_FROM || 'Gupta Store <onboarding@resend.dev>', to: [cleanEmail], subject, text, html }),
    });
    if (!res.ok) throw new Error('Order notification provider failed.');
    return { success: true, provider: 'resend' };
  }

  throw new Error('Email service not configured.');
}

export async function sendContactEmail(inquiry) {
  const recipient = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
  if (!recipient) throw new Error('Admin email is not configured.');

  const subject = `New customer message from ${inquiry.name}`;
  const text = `New Gupta Store enquiry\n\nName: ${inquiry.name}\nPhone: ${inquiry.phone}\nMessage: ${inquiry.message || '(No message)'}\nReceived: ${inquiry.createdAt}`;
  const html = `<div style="font-family:Arial,sans-serif;color:#0f172a;max-width:600px"><h2 style="color:#f97316">New customer message</h2><p><strong>Name:</strong> ${escapeHtml(inquiry.name)}</p><p><strong>Phone:</strong> ${escapeHtml(inquiry.phone)}</p><p><strong>Message:</strong><br/>${escapeHtml(inquiry.message || '(No message)').replace(/\n/g, '<br/>')}</p><p style="color:#64748b;font-size:12px">Received: ${escapeHtml(inquiry.createdAt)}</p></div>`;
  const transporter = getTransporter();

  if (transporter) {
    const sender = process.env.EMAIL_FROM || `Gupta General Store <${process.env.EMAIL_USER}>`;
    const info = await transporter.sendMail({ from: sender, to: recipient, subject, text, html });
    return { success: true, messageId: info.messageId, provider: 'smtp' };
  }

  if (process.env.RESEND_API_KEY) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.EMAIL_FROM || 'Gupta Store <onboarding@resend.dev>', to: [recipient], subject, text, html }),
    });
    if (!res.ok) throw new Error('Contact email provider failed.');
    return { success: true, provider: 'resend' };
  }

  throw new Error('Email service not configured.');
}
