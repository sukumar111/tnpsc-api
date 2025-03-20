process.env.TZ = 'Asia/Kolkata'; // Set timezone to IST

const express = require("express");
const router = express.Router();
const cors = require("cors");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const schedule = require("node-schedule");
const app = express();
const PORT = process.env.PORT || 7003;

app.use(cors());
app.use(bodyParser.json());

// Nodemailer configuration
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER || "tnpscstudyplanner@gmail.com", // Use environment variable
        pass: process.env.EMAIL_PASSWORD || "kwyyoyoifbnkqyru", // Use environment variable
    },
});

// Function to send scheduled email
const sendScheduledEmail = async (emailData, type) => {
    const { user_email, subject, message, day, start_time, end_time } = emailData;

    const emailSubject = type === 'completion'
        ? `Study Session Ended: ${subject}`
        : `Study Session Reminder: ${subject}`;

    const emailMessage = type === 'completion'
        ? `Your study session for <strong>${subject}</strong> has ended.`
        : `Your study session for <strong>${subject}</strong> is scheduled to start soon.`;

    const mailOptions = {
        from: "tnpscstudyplanner@gmail.com",
        to: user_email,
        subject: emailSubject,
        html: `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Study Planner Reminder</title>
                <style>
                    body { font-family: Arial, sans-serif; background-color: #f1f1f1; margin: 0; padding: 0; }
                    .email-container { max-width: 600px; margin: 0 auto; background-color: #fff; padding: 20px; border: 1px solid #cccccc; }
                    h1 { color: #333; }
                    h2 { color: #555; }
                    h3 { color: #777; }
                    a { color: #4CAF50; text-decoration: none; }
                    .button { display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; border-radius: 5px; text-decoration: none; }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <h1>Study Planner Reminder</h1>
                    <h2>Hello,</h2>
                    <h3>${emailMessage}</h3>
                    <h3>Details:</h3>
                    <ul>
                        <li><strong>Day:</strong> ${day}</li>
                        <li><strong>Start Time:</strong> ${start_time}</li>
                        <li><strong>End Time:</strong> ${end_time}</li>
                    </ul>
                    <p>Please ensure you are prepared for your session. If you need to reschedule, please update your planner.</p>
                    <a href="http://localhost:5173" class="button">Go to Study Planner</a>
                    <p>If you did not schedule this session, please contact us immediately.</p>
                    <p>Thank you,<br>TNPSC Study Planner</p>
                </div>
            </body>
            </html>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully for ${type === 'completion' ? "end time" : "start time"}!`);
        console.log("Message ID:", info.messageId);
    } catch (error) {
        console.error(`Error sending email for ${type === 'completion' ? "end time" : "start time"}:`, error);
    }
};

// API endpoint for scheduling emails
app.post("/schedule-email", (req, res) => {
    const { user_email, subject, message, day, start_time, end_time } = req.body;

    if (!user_email || !subject || !day || !start_time || !end_time) {
        return res.status(400).json({ error: "All fields are required" });
    }

    const emailData = {
        user_email,
        subject,
        message,
        day,
        start_time,
        end_time,
    };

    try {
        // Parse start_time and end_time to Date objects
        const startDate = new Date(`${day}T${start_time}`);
        const endDate = new Date(`${day}T${end_time}`);

        // Schedule reminder email 15 minutes before start_time
        const reminderTime = new Date(startDate.getTime() - 15 * 60000);
        schedule.scheduleJob(reminderTime, () => {
            sendScheduledEmail(emailData, 'reminder');
        });

        // Schedule completion email at end_time
        schedule.scheduleJob(endDate, () => {
            sendScheduledEmail(emailData, 'completion');
        });

        res.status(200).json({ success: true, message: "Emails scheduled successfully" });
    } catch (error) {
        console.error("Error scheduling emails:", error);
        res.status(500).json({ error: "Failed to schedule emails" });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = router;