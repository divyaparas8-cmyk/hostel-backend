const nodemailer = require("nodemailer");

// Create transporter using environment variables
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 465,
    secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_SECURE === true, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

/**
 * Verify SMTP connection
 * Returns true if successful, false otherwise.
 * Does not throw an error to prevent crashing the app on startup.
 */
const verifyConnection = async () => {
    try {
        // Skip verification if credentials are not provided yet
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.warn("SMTP credentials missing, skipping connection verification.");
            return false;
        }
        
        await transporter.verify();
        console.log("✅ SMTP connection established successfully.");
        return true;
    } catch (error) {
        console.error("❌ Failed to establish SMTP connection:", error.message);
        return false;
    }
};

/**
 * Send an email
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content (optional)
 * @returns {Promise<Object>} info - Nodemailer info object
 */
const sendEmail = async ({ to, subject, text, html }) => {
    try {
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.warn("SMTP credentials not configured. Skipping email sending.");
            return null;
        }

        const mailOptions = {
            from: process.env.SMTP_FROM || `"Hostel Admin" <${process.env.SMTP_USER}>`,
            to,
            subject,
            text,
            html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${to}. Message ID: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error("Error sending email:", error.message);
        throw error;
    }
};

module.exports = {
    transporter,
    verifyConnection,
    sendEmail
};
