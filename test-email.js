require('dotenv').config();
const { sendEmail, verifyConnection } = require('./src/services/email.service');

const runTest = async () => {
    console.log("--- SMTP Configuration Check ---");
    const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'];
    let missingVars = [];

    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            missingVars.push(envVar);
        }
    }

    if (missingVars.length > 0) {
        console.error("❌ Missing required SMTP environment variables:", missingVars.join(", "));
        console.error("Please add them to your .env file before running the test.");
        process.exit(1);
    }

    console.log("✅ All required SMTP environment variables are present.");
    console.log(`Using SMTP Host: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`);
    console.log(`Using Sender: ${process.env.SMTP_FROM}`);

    console.log("\n--- Verifying SMTP Connection ---");
    const isConnected = await verifyConnection();
    if (!isConnected) {
        console.error("❌ Failed to connect to SMTP server. Aborting test email.");
        process.exit(1);
    }

    const testRecipient = process.env.TEST_EMAIL;
    if (!testRecipient) {
        console.error("\n❌ TEST_EMAIL environment variable is not set.");
        console.error("Please run the test using:");
        console.error("On Windows PowerShell: $env:TEST_EMAIL=\"your_test_email@example.com\"; node test-email.js");
        console.error("On Windows CMD: set TEST_EMAIL=your_test_email@example.com && node test-email.js");
        process.exit(1);
    }

    console.log(`\n--- Sending Test Email to ${testRecipient} ---`);
    try {
        await sendEmail({
            to: testRecipient,
            subject: "Hostel BMS SMTP Test",
            text: "This is a test email from the Hostel Management System.",
        });
        console.log("✅ Test email sent successfully.");
    } catch (error) {
        console.error("❌ Failed to send test email.");
        process.exit(1);
    }
    
    process.exit(0);
};

runTest();
