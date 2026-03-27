const express = require("express");
const { Resend } = require("resend");

const app = express();
app.use(express.json());

const resend = new Resend(process.env.RESEND_API_KEY);
const CLINIC_EMAIL = process.env.CLINIC_EMAIL;

app.get("/", (req, res) => {
  res.send("Ajax Harwood Clinic — Retell Email Server is running ✅");
});

app.post("/retell-webhook", async (req, res) => {
  try {
    const data = req.body;
    const callAnalysis = data.call_analysis || {};
    const customData = callAnalysis.custom_analysis_data || {};
    const patientName = customData.patient_name || data.from_number || "Not provided";
    const phoneNumber = data.from_number || "Not provided";
    const reasonVisit = customData.reason_for_visit || callAnalysis.call_summary || "Not provided";
    const doctorName = customData.doctor_requested || "Not specified";
    const callTimestamp = data.start_timestamp
      ? new Date(data.start_timestamp).toLocaleString("en-CA", {
          timeZone: "America/Toronto",
          dateStyle: "full",
          timeStyle: "short",
        })
      : "Not available";
    const emailBody = `
NEW PATIENT CALL - Ajax Harwood Clinic

Date & Time: ${callTimestamp}
Patient Name: ${patientName}
Phone Number: ${phoneNumber}
Reason for Visit: ${reasonVisit}
Doctor Requested: ${doctorName}

This notification was sent automatically by your Ajax Harwood Clinic voice assistant.
    `.trim();
    await resend.emails.send({
      from: "Ajax Harwood Clinic <onboarding@resend.dev>",
      to: CLINIC_EMAIL,
      subject: `New Patient Call - ${patientName} - ${callTimestamp}`,
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
