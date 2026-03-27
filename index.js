const express = require("express");
const nodemailer = require("nodemailer");

const app = express();
app.use(express.json());

// ─── CONFIGURATION ───────────────────────────────────────────────
// These are filled in using Render environment variables (you set these in Render's dashboard)
const GMAIL_USER = process.env.GMAIL_USER;       // e.g. youremail@gmail.com
const GMAIL_PASS = process.env.GMAIL_PASS;       // Gmail App Password (not your regular password)
const CLINIC_EMAIL = process.env.CLINIC_EMAIL;   // ajaxharwoodclinic@gmail.com
// ─────────────────────────────────────────────────────────────────

// Email transporter using Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_PASS,
  },
});

// Health check — Render uses this to confirm the server is running
app.get("/", (req, res) => {
  res.send("Ajax Harwood Clinic — Retell Email Server is running ✅");
});

// Webhook endpoint — Retell sends call data here after every call
app.post("/retell-webhook", async (req, res) => {
  try {
    const data = req.body;

    // Pull the fields Retell sends
    const callAnalysis = data.call_analysis || {};
    const customData   = callAnalysis.custom_analysis_data || {};

    const patientName  = customData.patient_name  || data.from_number || "Not provided";
    const phoneNumber  = data.from_number          || "Not provided";
    const reasonVisit  = customData.reason_for_visit || callAnalysis.call_summary || "Not provided";
    const doctorName   = customData.doctor_requested || "Not specified";

    // Format the call date/time
    const callTimestamp = data.start_timestamp
      ? new Date(data.start_timestamp).toLocaleString("en-CA", {
          timeZone: "America/Toronto",
          dateStyle: "full",
          timeStyle: "short",
        })
      : "Not available";

    // Build the email
    const emailBody = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  📞 NEW PATIENT CALL — Ajax Harwood Clinic
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🗓  Date & Time:       ${callTimestamp}
👤  Patient Name:      ${patientName}
📱  Phone Number:      ${phoneNumber}
🩺  Reason for Visit:  ${reasonVisit}
👨‍⚕️  Doctor Requested:  ${doctorName}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This notification was sent automatically by your
Ajax Harwood Clinic voice assistant via Retell AI.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();

    await transporter.sendMail({
      from: `"Ajax Harwood Clinic Voice Assistant" <${GMAIL_USER}>`,
      to: CLINIC_EMAIL,
      subject: `📞 New Patient Call — ${patientName} — ${callTimestamp}`,
      text: emailBody,
    });

    console.log(`✅ Email sent for call from ${phoneNumber}`);
    res.status(200).json({ success: true });

  } catch (error) {
    console.error("❌ Error processing webhook:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
