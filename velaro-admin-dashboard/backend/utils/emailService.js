const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");

let transporter = null;

const createTransporter = async () => {
  // 1. Check custom SMTP configuration
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    const port = Number(process.env.SMTP_PORT) || 465;
    const isSecure = process.env.SMTP_SECURE === "true" || (!process.env.SMTP_PORT && port === 465) || port === 465;
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: port,
      secure: isSecure,
      auth: {
        user: process.env.SMTP_USER.trim(),
        pass: process.env.SMTP_PASS.trim().replace(/\s+/g, "")
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  // 2. Check Gmail user & app password
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER.trim(),
        pass: process.env.EMAIL_PASS.trim().replace(/\s+/g, "")
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  // 3. Fallback to Ethereal Email test account for development
  try {
    const testAccount = await nodemailer.createTestAccount();
    const ethTransporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    console.warn("\n⚠️  [Email Service] NOTICE: Neither EMAIL_USER/EMAIL_PASS nor SMTP_USER/SMTP_PASS is set in .env.");
    console.warn(`[Email Service] Running in sandbox mode with Ethereal test account: ${testAccount.user}`);
    console.warn("[Email Service] Real emails will NOT be delivered until you add your email credentials to .env.\n");
    return ethTransporter;
  } catch (err) {
    console.warn("[Email Service] Fallback to simulated transport:", err.message);
    return {
      sendMail: async (opts) => {
        console.log(`[Email Service - Simulated] To: ${opts.to} | Subject: ${opts.subject}`);
        return { messageId: "simulated-" + Date.now() };
      },
      verify: async () => true
    };
  }
};

const getTransporter = async (forceRefresh = false) => {
  if (transporter && !forceRefresh) return transporter;
  transporter = await createTransporter();
  return transporter;
};

const resetTransporter = () => {
  transporter = null;
};

const verifyEmailService = async () => {
  try {
    const t = await getTransporter(true);
    if (t.verify) {
      await t.verify();
      return { success: true, message: "Transporter connected and verified successfully" };
    }
    return { success: true, message: "Transporter ready" };
  } catch (error) {
    return { success: false, error: error.message, code: error.code };
  }
};

// Generates bill punch holes across the top above the shop name with spacing between each hole
const renderBillHoles = () => {
  const holes = Array(11)
    .fill(
      '<td align="center" style="padding: 0 5px;"><div style="width: 13px; height: 13px; border-radius: 50%; background-color: #eaedf1; border: 1px solid #cbd5e1; box-shadow: inset 0 1px 2px rgba(0,0,0,0.14);"></div></td>'
    )
    .join("");

  return `
    <table cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
      <tr>
        ${holes}
      </tr>
    </table>
  `;
};

// Generates order tracking milestone bar
const renderOrderTracker = (status = "Processing") => {
  const steps = [
    { key: "Ordered", label: "Ordered" },
    { key: "Processing", label: "Processing" },
    { key: "Shipped", label: "Shipped" },
    { key: "Delivered", label: "Delivered" }
  ];

  const statusLower = String(status).toLowerCase();
  let activeIndex = 0;
  if (statusLower === "pending") activeIndex = 0;
  else if (statusLower === "processing") activeIndex = 1;
  else if (statusLower === "shipped") activeIndex = 2;
  else if (statusLower === "delivered") activeIndex = 3;
  else if (statusLower === "cancelled" || statusLower === "refunded") activeIndex = -1;

  const stepsHtml = steps.map((s, idx) => {
    const isCompleted = idx <= activeIndex && activeIndex !== -1;
    const isCurrent = idx === activeIndex;
    const dotBg = isCurrent ? "#0f172a" : isCompleted ? "#334155" : "#cbd5e1";
    const textColor = isCurrent ? "#0f172a" : isCompleted ? "#475569" : "#94a3b8";
    const fontWeight = isCurrent ? "700" : "500";

    return `
      <td align="center" style="width: 25%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="width: 18px; height: 18px; border-radius: 50%; background-color: ${dotBg}; margin: 0 auto 6px auto; line-height: 18px; text-align: center; color: #ffffff; font-size: 10px; font-weight: bold;">
          ${isCompleted ? (idx === 2 ? "🚚" : "✓") : ""}
        </div>
        <span style="font-size: 11px; color: ${textColor}; font-weight: ${fontWeight}; display: block;">
          ${s.label}
        </span>
      </td>
    `;
  }).join("");

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 14px;">
      <tr>
        ${stepsHtml}
      </tr>
    </table>
  `;
};

/**
 * Sends order confirmation / shipment status update email
 */
const sendOrderEmail = async ({ orderId, items = [], paymentMethod, status = "Processing", user, phone, address }) => {
  try {
    const recipientEmail = user?.email || (typeof user === "string" ? user : null);
    if (!recipientEmail) {
      console.warn(`[Email Service] Skipped: No recipient email found for Order #${orderId}`);
      return;
    }

    const t = await getTransporter();
    const logoPath = path.resolve(__dirname, "../assets/velaro-logo.jpg");
    const hasLogo = fs.existsSync(logoPath);

    const isShipped = status.toLowerCase() === "shipped";
    const isDelivered = status.toLowerCase() === "delivered";
    const subjectPrefix = isShipped ? "Shipped: " : isDelivered ? "Delivered: " : "Order Confirmed: ";
    const subject = `${subjectPrefix}Your Velaro Order #${orderId}`;

    // Normalize payment method label
    const isCOD = String(paymentMethod).toLowerCase().includes("cash") || String(paymentMethod).toLowerCase().includes("cod");
    const paymentDisplay = isCOD ? "Cash on Delivery (COD)" : "Paid Online";

    // Status badge
    let statusBadgeBg = "#eff6ff";
    let statusBadgeColor = "#1e40af";
    let statusText = status + " ✓";

    if (isShipped) {
      statusBadgeBg = "#e8f5e9";
      statusBadgeColor = "#166534";
      statusText = "Shipped ✓";
    } else if (isDelivered) {
      statusBadgeBg = "#f0fdf4";
      statusBadgeColor = "#15803d";
      statusText = "Delivered 🎉";
    } else if (status.toLowerCase() === "cancelled") {
      statusBadgeBg = "#fef2f2";
      statusBadgeColor = "#991b1b";
      statusText = "Cancelled";
    }

    // Items list HTML
    const itemsList = Array.isArray(items) ? items : [items];
    const itemsHtml = itemsList.map((item) => {
      const name = item.productName || item.name || "Tailored Item";
      const sizeStr = item.size ? ` (Size ${item.size})` : "";
      const qty = item.quantity || 1;
      const priceVal = Number(item.price || 0);
      return `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13.5px; color: #1e293b; padding: 5px 0; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between;">
          <span><b style="color: #0f172a;">${qty}x</b> ${name}${sizeStr}</span>
          ${priceVal ? `<span style="color: #475569; font-weight: 500;">₹${(priceVal * qty).toLocaleString("en-IN")}</span>` : ""}
        </div>
      `;
    }).join("");

    // Calculate total
    const total = itemsList.reduce((acc, curr) => acc + (Number(curr.price || 0) * Number(curr.quantity || 1)), 0);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style="margin: 0; padding: 0; background-color: #eaedf1; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #eaedf1; padding: 36px 12px;">
          <tr>
            <td align="center">
              
              <!-- Bill Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 440px; background-color: #ffffff; border-radius: 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #dcdfe4; overflow: hidden;">
                
                <!-- Perforated Bill Holes Header Above Shop Name -->
                <tr>
                  <td align="center" style="background-color: #f8fafc; padding: 14px 16px 12px 16px; border-bottom: 2px dashed #cbd5e1;">
                    ${renderBillHoles()}
                  </td>
                </tr>

                <!-- Content Area -->
                <tr>
                  <td style="padding: 26px 30px 30px 30px;">

                    <!-- Brand row with Logo on the left and VELARO on the right -->
                    <table cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 20px auto;">
                      <tr>
                        <td style="vertical-align: middle; padding-right: 12px;">
                          ${
                            hasLogo
                              ? '<img src="cid:velaro-logo" alt="V" width="34" height="34" style="display: block; border-radius: 50%; border: 1px solid #d4af37;" />'
                              : '<div style="width: 32px; height: 32px; border-radius: 50%; background: #0f172a; color: #d4af37; text-align: center; line-height: 32px; font-weight: bold; font-size: 16px;">V</div>'
                          }
                        </td>
                        <td style="vertical-align: middle;">
                          <span style="font-size: 24px; font-weight: 800; letter-spacing: 0.18em; color: #0f172a;">VELARO</span>
                        </td>
                      </tr>
                    </table>

                    <!-- Title, Order ID, and Status in center -->
                    <div style="text-align: center; margin-bottom: 22px;">
                      <h2 style="margin: 0 0 6px 0; font-size: 21px; font-weight: 700; color: #0f172a;">${isShipped ? "Shipment Details" : isDelivered ? "Delivery Details" : "Order Details"}</h2>
                      <p style="margin: 0 0 12px 0; font-size: 13.5px; color: #64748b;">Order ID: <b>#${orderId}</b></p>
                      <div>
                        <span style="display: inline-block; background-color: ${statusBadgeBg}; color: ${statusBadgeColor}; padding: 4px 16px; border-radius: 999px; font-size: 12.5px; font-weight: 700;">
                          ${statusText}
                        </span>
                      </div>
                    </div>

                    <!-- Payment Mode Details -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 18px;">
                      <tr>
                        <td style="padding: 12px 14px; font-size: 13px; font-weight: 600; color: #64748b;">Payment Method</td>
                        <td align="right" style="padding: 12px 14px; font-size: 13.5px; font-weight: 700; color: ${isCOD ? "#b45309" : "#15803d"};">
                          ${paymentDisplay}
                        </td>
                      </tr>
                    </table>

                    <!-- Items List -->
                    <div style="margin-bottom: 16px;">
                      <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 8px;">Order Summary</div>
                      ${itemsHtml}
                    </div>

                    <!-- Pricing Breakdown -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                      <tr>
                        <td style="font-size: 12.5px; color: #64748b; text-align: right; padding-bottom: 4px;">Subtotal</td>
                        <td style="font-size: 12.5px; color: #334155; text-align: right; width: 90px; padding-bottom: 4px;">₹${total.toLocaleString("en-IN")}</td>
                      </tr>
                      <tr>
                        <td style="font-size: 12.5px; color: #64748b; text-align: right; padding-bottom: 8px;">Shipping</td>
                        <td style="font-size: 12.5px; color: #16a34a; text-align: right; font-weight: 600; padding-bottom: 8px;">Free</td>
                      </tr>
                      <tr>
                        <td style="font-size: 15px; font-weight: 700; color: #0f172a; text-align: right; padding-top: 8px; border-top: 1px solid #f1f5f9;">Total:</td>
                        <td style="font-size: 16px; font-weight: 800; color: #0f172a; text-align: right; padding-top: 8px; border-top: 1px solid #f1f5f9;">₹${total.toLocaleString("en-IN")}</td>
                      </tr>
                    </table>

                    ${address ? `
                    <div style="font-size: 12px; color: #64748b; margin-bottom: 18px; padding: 10px 12px; background: #f8fafc; border-radius: 6px; border-left: 3px solid #d4af37;">
                      <b style="color: #0f172a;">Shipping to:</b> ${address} ${phone ? `<br/><b style="color: #0f172a;">Contact:</b> ${phone}` : ''}
                    </div>` : ''}

                    <!-- Tracking Milestone Bar -->
                    <div style="padding-top: 14px; border-top: 1px dashed #cbd5e1;">
                      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; text-align: center; margin-bottom: 8px;">Status Progress</div>
                      ${renderOrderTracker(status)}
                    </div>

                  </td>
                </tr>

                <!-- Bottom Footer Note -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 14px 20px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
                    VELARO BESPOKE MEN &middot; Handcrafted Elegance
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const textContent = `VELARO - Order ${status}
Order #${orderId}
Status: ${status}
Payment: ${paymentDisplay}

Order Summary:
${itemsList.map(item => `- ${item.quantity || 1}x ${item.productName || item.name || "Item"}${item.size ? ` (Size ${item.size})` : ""} - ₹${((Number(item.price || 0)) * Number(item.quantity || 1)).toLocaleString("en-IN")}`).join("\n")}

Total: ₹${total.toLocaleString("en-IN")}
Shipping to: ${address || "Bespoke Delivery"}
${phone ? `Contact: ${phone}` : ""}

Thank you for choosing Velaro Atelier.`;

    const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER || process.env.SMTP_USER || "atelier@velaro.in";
    const mailOptions = {
      from: `"Velaro Atelier" <${fromAddress}>`,
      to: recipientEmail,
      subject,
      text: textContent,
      html: htmlContent,
      attachments: hasLogo
        ? [
            {
              filename: "velaro-logo.jpg",
              path: logoPath,
              cid: "velaro-logo"
            }
          ]
        : []
    };

    const info = await t.sendMail(mailOptions);
    console.log(`[Email Service] Order notification sent to ${recipientEmail} (Status: ${status}) | MessageId: ${info.messageId}`);
    if (nodemailer.getTestMessageUrl && typeof nodemailer.getTestMessageUrl === "function") {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) console.log(`[Email Service - Preview Sandbox]: ${previewUrl}`);
    }
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[Email Service] Failed to send order email:", error.code || error.name, error.message);
    if (error.response) console.error("[Email Service] SMTP Details:", error.response);
    return { success: false, error: error.message, code: error.code };
  }
};

/**
 * Sends appointment booking / confirmation / status update email
 */
const sendAppointmentEmail = async ({ appointment, status }) => {
  try {
    const recipientEmail = appointment?.email;
    if (!recipientEmail) {
      console.warn("[Email Service] Skipped: No recipient email found for Appointment");
      return;
    }

    const t = await getTransporter();
    const logoPath = path.resolve(__dirname, "../assets/velaro-logo.jpg");
    const hasLogo = fs.existsSync(logoPath);

    const aptId = (appointment._id || appointment.id || Date.now()).toString().slice(-6).toUpperCase();
    const currentStatus = status || appointment.status || "Confirmed";
    const subject = `Appointment ${currentStatus}: Velaro Atelier (#APT-${aptId})`;

    // Map service slugs if necessary
    const serviceMap = {
      wedding: "Wedding Suit Fitting & Styling",
      formal: "Formal Wear Consultation",
      casual: "Smart Casual Wardrobe",
      alterations: "Bespoke Alterations & Tailoring"
    };
    const serviceDisplay = serviceMap[String(appointment.service).toLowerCase()] || appointment.service || "Bespoke Fitting & Consultation";

    // Status badge
    let statusBadgeBg = "#eff6ff";
    let statusBadgeColor = "#1e40af";
    if (currentStatus.toLowerCase() === "confirmed") {
      statusBadgeBg = "#e8f5e9";
      statusBadgeColor = "#166534";
    } else if (currentStatus.toLowerCase() === "completed") {
      statusBadgeBg = "#f0fdf4";
      statusBadgeColor = "#15803d";
    } else if (currentStatus.toLowerCase() === "cancelled") {
      statusBadgeBg = "#fef2f2";
      statusBadgeColor = "#991b1b";
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style="margin: 0; padding: 0; background-color: #eaedf1; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #eaedf1; padding: 36px 12px;">
          <tr>
            <td align="center">
              
              <!-- Bill Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 440px; background-color: #ffffff; border-radius: 14px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #dcdfe4; overflow: hidden;">
                
                <!-- Perforated Bill Holes Header Above Shop Name -->
                <tr>
                  <td align="center" style="background-color: #f8fafc; padding: 14px 16px 12px 16px; border-bottom: 2px dashed #cbd5e1;">
                    ${renderBillHoles()}
                  </td>
                </tr>

                <!-- Content Area -->
                <tr>
                  <td style="padding: 26px 30px 30px 30px;">

                    <!-- Brand row with Logo on the left and VELARO on the right -->
                    <table cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 20px auto;">
                      <tr>
                        <td style="vertical-align: middle; padding-right: 12px;">
                          ${
                            hasLogo
                              ? '<img src="cid:velaro-logo" alt="V" width="34" height="34" style="display: block; border-radius: 50%; border: 1px solid #d4af37;" />'
                              : '<div style="width: 32px; height: 32px; border-radius: 50%; background: #0f172a; color: #d4af37; text-align: center; line-height: 32px; font-weight: bold; font-size: 16px;">V</div>'
                          }
                        </td>
                        <td style="vertical-align: middle;">
                          <span style="font-size: 24px; font-weight: 800; letter-spacing: 0.18em; color: #0f172a;">VELARO</span>
                        </td>
                      </tr>
                    </table>

                    <!-- Title, Appointment ID, and Status in center -->
                    <div style="text-align: center; margin-bottom: 22px;">
                      <h2 style="margin: 0 0 6px 0; font-size: 21px; font-weight: 700; color: #0f172a;">Appointment Details</h2>
                      <p style="margin: 0 0 12px 0; font-size: 13.5px; color: #64748b;">Booking ID: <b>#APT-${aptId}</b></p>
                      <div>
                        <span style="display: inline-block; background-color: ${statusBadgeBg}; color: ${statusBadgeColor}; padding: 4px 16px; border-radius: 999px; font-size: 12.5px; font-weight: 700;">
                          ${currentStatus} ✓
                        </span>
                      </div>
                    </div>

                    <!-- Client & Service Details -->
                    <div style="margin-bottom: 14px;">
                      <div style="font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px;">Client Name</div>
                      <div style="font-size: 14px; font-weight: 600; color: #0f172a;">${appointment.name || "Bespoke Client"}</div>
                    </div>

                    <div style="margin-bottom: 14px;">
                      <div style="font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px;">Service Requested</div>
                      <div style="font-size: 14px; color: #334155;">${serviceDisplay}</div>
                    </div>

                    <div style="margin-bottom: 14px;">
                      <div style="font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px;">Date &amp; Time</div>
                      <div style="font-size: 14px; color: #0f172a; font-weight: 600;">${appointment.date || "Scheduled Date"} &middot; ${appointment.time || "Scheduled Time"}</div>
                    </div>

                    ${appointment.phone ? `
                    <div style="margin-bottom: 14px;">
                      <div style="font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px;">Contact Phone</div>
                      <div style="font-size: 13.5px; color: #334155;">${appointment.phone}</div>
                    </div>` : ''}

                    <div style="margin-top: 18px; padding: 12px 14px; background: #f8fafc; border-radius: 8px; border-left: 3px solid #d4af37;">
                      <div style="font-size: 12px; font-weight: 700; color: #0f172a; margin-bottom: 2px;">Atelier Location</div>
                      <div style="font-size: 12px; color: #475569;">Velaro Bespoke Studio &middot; Luxury Atelier Suite, Boutique Floor</div>
                    </div>

                  </td>
                </tr>

                <!-- Bottom Footer Note -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 14px 20px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9;">
                    VELARO BESPOKE MEN &middot; Tailored Fittings &amp; Consultations
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const textContent = `VELARO - Appointment ${currentStatus}
Booking ID: #APT-${aptId}
Client: ${appointment.name || "Bespoke Client"}
Service: ${serviceDisplay}
Date & Time: ${appointment.date || "Scheduled Date"} at ${appointment.time || "Scheduled Time"}
${appointment.phone ? `Phone: ${appointment.phone}\n` : ""}Location: Velaro Bespoke Studio, Luxury Atelier Suite, Boutique Floor

Thank you for booking with Velaro Atelier.`;

    const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER || process.env.SMTP_USER || "atelier@velaro.in";
    const mailOptions = {
      from: `"Velaro Atelier" <${fromAddress}>`,
      to: recipientEmail,
      subject,
      text: textContent,
      html: htmlContent,
      attachments: hasLogo
        ? [
            {
              filename: "velaro-logo.jpg",
              path: logoPath,
              cid: "velaro-logo"
            }
          ]
        : []
    };

    const info = await t.sendMail(mailOptions);
    console.log(`[Email Service] Appointment notification sent to ${recipientEmail} (Status: ${currentStatus}) | MessageId: ${info.messageId}`);
    if (nodemailer.getTestMessageUrl && typeof nodemailer.getTestMessageUrl === "function") {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) console.log(`[Email Service - Preview Sandbox]: ${previewUrl}`);
    }
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[Email Service] Failed to send appointment email:", error.code || error.name, error.message);
    if (error.response) console.error("[Email Service] SMTP Details:", error.response);
    return { success: false, error: error.message, code: error.code };
  }
};

module.exports = {
  sendOrderEmail,
  sendAppointmentEmail,
  verifyEmailService,
  getTransporter,
  resetTransporter
};
