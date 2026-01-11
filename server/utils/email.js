const nodemailer = require("nodemailer");

/**
 * Escapes HTML special characters to prevent XSS
 * @param {string} unsafe - Unsafe string that may contain HTML
 * @returns {string} - HTML-escaped safe string
 */
function escapeHtml(unsafe) {
  if (typeof unsafe !== "string") {
    return String(unsafe);
  }
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Sends an email notification to the Admin when a new user registers.
 *
 * @param {Object} user - The new user object { username, id }
 */
const sendAdminNotification = async (user) => {
  // 1. Check if email service is configured
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, ADMIN_EMAIL } =
    process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !ADMIN_EMAIL) {
    console.warn(
      "Email service not fully configured. Skipping admin notification."
    );
    return;
  }

  try {
    // 2. Create Transporter
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT || 587,
      secure: SMTP_PORT == 465, // true for 465, false for other ports
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    // Sanitize user data to prevent XSS
    const safeUsername = escapeHtml(user.username);
    const safeUserId = escapeHtml(String(user.id));

    // 3. Send Email
    const info = await transporter.sendMail({
      from: `"LaundromatZat Bot" <${SMTP_USER}>`, // sender address
      to: ADMIN_EMAIL, // list of receivers (the admin)
      subject: `📢 New User Registration: ${safeUsername}`, // Subject line
      text: `Heads up! A new user has registered and is waiting for approval.\n\nUsername: ${user.username}\nUser ID: ${user.id}\n\nPlease log in to the Admin Dashboard to approve or reject them.\nhttps://laundromatzat.com/login`, // plain text body
      html: `
        <h3>New User Pending Approval</h3>
        <p><strong>Username:</strong> ${safeUsername}</p>
        <p><strong>User ID:</strong> ${safeUserId}</p>
        <p>They are currently blocked from logging in until you approve them.</p>
        <br/>
        <a href="https://laundromatzat.com/login" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Go to Admin Dashboard</a>
      `, // html body
    });

    console.log("Admin notification email sent: %s", info.messageId);
  } catch (error) {
    console.error("Failed to send admin notification email:", error);
    // We do NOT throw here, so we don't break the registration flow.
  }
};

module.exports = { sendAdminNotification };
