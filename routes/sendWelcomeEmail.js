const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 7002; // Use a different port to avoid conflicts

app.use(express.json());
app.use(cors());

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: "tnpscstudyplanner@gmail.com", // Your Gmail ID
        pass: "kwyyoyoifbnkqyru", // App Password
    },
});

// Function to send welcome email
const sendWelcomeEmail = async (email, userName) => {
    const mailOptions = {
        from: "tnpscstudyplanner@gmail.com", // Your email
        to: email, // User's email
        subject: "Welcome to TNPSC Study Planner",
        html: `
            <!DOCTYPE html>
            <html xmlns:th="http://www.thymeleaf.org">
            <head>
                <title>Welcome Email</title>
            </head>
            <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; color: #333;">
                <!-- Welcome Message -->
                <div style="text-align: center; margin-top: 20px;">
                    <h1>Hi ${userName}!</h1>
                </div>

                <!-- Registration Confirmation -->
                <div style="margin: 20px auto; max-width: 600px; text-align: center;">
                    <p>Congratulations! You have successfully registered for access to your dashboard.</p>

                    <!-- Sign In Button -->
                    <p>
                        <a href="http://localhost:5173/"
                           style="display: inline-block; padding: 10px 20px; color: white; background-color: #4CAF50;
                               text-decoration: none; border-radius: 4px; margin-top: 15px;">Sign In Here</a>
                    </p>

                    <!-- Additional Info -->
                    <p>If you encounter any issues, please copy and paste the following link into your browser:</p>
                    <p><a href="http://localhost:5173/" style="color: #4CAF50;">http://localhost:5173/</a></p>
                    <!-- Footer -->
                    <p>For any assistance, please contact our support team.</p>
                </div>
            </body>
            </html>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log("Welcome email sent successfully!");
    } catch (error) {
        console.error("Error sending welcome email:", error);
    }
};

// API endpoint for sending welcome email
app.post("/send-welcome-email", async (req, res) => {
    const { email, userName } = req.body;

    if (!email || !userName) {
        return res.status(400).json({ error: "Email and userName are required" });
    }

    try {
        await sendWelcomeEmail(email, userName);
        res.json({ success: true, message: "Welcome email sent!" });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Failed to send welcome email" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = router;