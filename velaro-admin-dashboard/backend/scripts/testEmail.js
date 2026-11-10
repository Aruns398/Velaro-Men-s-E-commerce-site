require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const { sendOrderEmail, verifyEmailService, getTransporter } = require("../utils/emailService");

async function runDiagnostic() {
  console.log("==================================================");
  console.log("       VELARO NODEMAILER DIAGNOSTIC TOOL          ");
  console.log("==================================================");

  const hasGmailConfig = Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);
  const hasSmtpConfig = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

  console.log("\n1. Environment Configuration Check:");
  console.log(` - EMAIL_USER: ${process.env.EMAIL_USER ? `Configured (${process.env.EMAIL_USER})` : "MISSING (Not set in .env)"}`);
  console.log(` - EMAIL_PASS: ${process.env.EMAIL_PASS ? "Configured (App Password set)" : "MISSING (Not set in .env)"}`);
  console.log(` - SMTP_USER : ${process.env.SMTP_USER ? `Configured (${process.env.SMTP_USER})` : "Not set (optional if using EMAIL_USER)"}`);
  console.log(` - SMTP_PASS : ${process.env.SMTP_PASS ? "Configured" : "Not set"}`);

  if (!hasGmailConfig && !hasSmtpConfig) {
    console.log("\n⚠️  STATUS: NO CREDENTIALS CONFIGURED");
    console.log("--------------------------------------------------");
    console.log("Nodemailer is currently falling back to Ethereal sandbox test mode.");
    console.log("Real emails will NOT be delivered to actual inboxes until you configure credentials.");
    console.log("\nTo configure Gmail:");
    console.log("1. Enable 2-Step Verification in your Google Account: https://myaccount.google.com/security");
    console.log("2. Create an App Password at: https://myaccount.google.com/apppasswords");
    console.log("3. Add the following to your backend/.env file:");
    console.log("   EMAIL_USER=your_email@gmail.com");
    console.log("   EMAIL_PASS=your_16_digit_app_password");
    console.log("4. Restart backend server and rerun: npm run test:email");
    console.log("--------------------------------------------------\n");
  } else {
    console.log("\n✓ Found email credentials. Verifying transporter connection...");
  }

  console.log("\n2. Testing Transporter Connection...");
  const verifyResult = await verifyEmailService();
  if (!verifyResult.success) {
    console.error("❌ Transporter Connection Failed!");
    console.error("   Error Code   :", verifyResult.code || "UNKNOWN");
    console.error("   Error Message:", verifyResult.error);
    if (verifyResult.code === "EAUTH" || String(verifyResult.error).includes("Username and Password not accepted")) {
      console.error("\n💡 TROUBLESHOOTING GMAIL AUTHENTICATION:");
      console.error("   - You cannot use your standard Google password.");
      console.error("   - You MUST generate a 16-character App Password at: https://myaccount.google.com/apppasswords");
      console.error("   - Make sure 2-Step Verification is enabled on your Google account.");
      console.error("   - Verify EMAIL_USER is your exact Gmail address.");
    }
    process.exit(1);
  }
  console.log("✓ Transporter verified successfully!");

  const targetEmail = process.argv[2] || process.env.EMAIL_USER || process.env.SMTP_USER || "test@example.com";
  console.log(`\n3. Sending Test Order Email to: ${targetEmail}...`);

  const result = await sendOrderEmail({
    orderId: "TEST-" + Math.floor(100000 + Math.random() * 900000),
    items: [
      {
        productName: "Velaro Bespoke Test Tuxedo",
        size: "42R",
        quantity: 1,
        price: 8499
      }
    ],
    paymentMethod: "Online Payment",
    status: "Processing",
    user: {
      name: "Valued Customer",
      email: targetEmail
    },
    phone: "+91 98765 43210",
    address: "Velaro Atelier Suite, Race Course Road, Coimbatore"
  });

  if (result && result.success) {
    console.log("\n🎉 SUCCESS: Test email sent successfully!");
    console.log(`   Message ID: ${result.messageId}`);
    if (hasGmailConfig || hasSmtpConfig) {
      console.log(`   Check inbox at: ${targetEmail} (also check Spam/Promotions tab).`);
    } else {
      console.log("   (Sandbox Mode: Check the Preview URL logged above to view the email)");
    }
  } else {
    console.error("\n❌ FAILED to send test email.");
    console.error("   Error:", result?.error);
  }
  console.log("==================================================\n");
}

runDiagnostic().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
