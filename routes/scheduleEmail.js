process.env.TZ = 'Asia/Kolkata'; // Set timezone to IST

const express = require("express");
const router = express.Router();
const cors = require("cors");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const schedule = require("node-schedule");
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 7003;

app.use(cors());
app.use(bodyParser.json());

const HASURA_ENDPOINT = "https://tnpsc.hasura.app/v1/graphql";
const HASURA_ADMIN_SECRET = "8PVw6kZf35cgpmorJ3W8zpy5L42QUWKyak9fKGCybrE7809gv4Kd5SwoF0zcsN56";

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

// Function to send email
const sendEmail = async (emailData, type) => {
  const { user_email, subject, day, start_time, end_time } = emailData;

const emailSubject =
  type === "completion"
    ? `Study Session Ended: ${subject}`
    : `Study Session Reminder: ${subject}`;

const emailMessage =
  type === "completion"
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
    console.log(`Email sent successfully: ${emailSubject}`);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

// Function to fetch tasks from Hasura and send emails
const checkAndSendEmails = async () => {
  try {
    const now = new Date();
    now.setSeconds(0, 0); // Remove milliseconds for accuracy
    const nowTimeString = now.toISOString().slice(11, 19); // Format: HH:MM:SS

    console.log(`Checking tasks at: ${now.toLocaleTimeString()}`);

    const query = `
      query GetTasks {
        task(order_by: { start_time: asc }) {
          id
          name
          subject
          start_time
          end_time
          day
          user {
            email
          }
        }
      }
    `;

    const response = await axios.post(
      HASURA_ENDPOINT,
      { query },
      { headers: { "x-hasura-admin-secret": HASURA_ADMIN_SECRET } }
    );

    if (!response.data || !response.data.data) {
      console.error("Error fetching tasks from Hasura");
      return;
    }

    const tasks = response.data.data.task;

    tasks.forEach((task) => {
      const user_email = task.user?.email;
      if (!user_email) return;

      const taskDay = task.day.toLowerCase();
      const todayDay = now.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();

      if (taskDay !== todayDay) return; // Skip if not today's task

      const [startHour, startMinute] = task.start_time.split(":").map(Number);
      const [endHour, endMinute] = task.end_time.split(":").map(Number);

      // Create Date objects for start and end times
      const startTime = new Date(now);
      startTime.setHours(startHour, startMinute, 0, 0);

      const endTime = new Date(now);
      endTime.setHours(endHour, endMinute, 0, 0);

      // Schedule Reminder Email (15 minutes before start time)
      const reminderTime = new Date(startTime);
      reminderTime.setMinutes(reminderTime.getMinutes() - 15);

      if (reminderTime > now && reminderTime - now < 5 * 60 * 1000) {
        console.log(`Scheduling reminder email for task: ${task.name}`);
        sendEmail({ user_email, subject: task.subject, day: task.day, start_time: task.start_time, end_time: task.end_time }, "reminder");
      }

      // Schedule Completion Email (At end time)
      if (endTime > now && endTime - now < 5 * 60 * 1000) {
        console.log(`Scheduling completion email for task: ${task.name}`);
        sendEmail({ user_email, subject: task.subject, day: task.day, start_time: task.start_time, end_time: task.end_time }, "completion");
      }
    });
  } catch (error) {
    console.error("Error checking and sending emails:", error);
  }
};

// Run scheduler every 1 minutes
schedule.scheduleJob("*/1 * * * *", checkAndSendEmails);

// API to trigger email scheduling manually
app.post("/schedule-email", (req, res) => {
  checkAndSendEmails();
  res.status(200).json({ success: true, message: "Scheduler triggered manually" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = router;
