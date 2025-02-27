const express = require("express");
var router = express.Router();
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 7000;

app.use(express.json());
app.use(cors());

const HASURA_URL = "https://tnpsc.hasura.app/v1/graphql"; // Ensure this is correct

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: "sukumarm9339@gmail.com", // Your Gmail ID
        pass: "aqdzamketnrkccef", // App Password
    },
});

// Function to update OTP in the database
const updateOtpInDatabase = async (email, otpCode) => {
    const query = `
        mutation UpdateOtp($email: String!, $otp: String!) {
            update_users(where: { email: { _eq: $email } }, _set: { otp: $otp }) {
                affected_rows
            }
        }
    `;

    const variables = { email, otp: otpCode.toString() };

    try {
        const response = await fetch(HASURA_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-hasura-admin-secret": "8PVw6kZf35cgpmorJ3W8zpy5L42QUWKyak9fKGCybrE7809gv4Kd5SwoF0zcsN56",
            },
            body: JSON.stringify({ query, variables }),
        });

        const data = await response.json();
        return data.data.update_users.affected_rows > 0;
    } catch (error) {
        console.error("Error updating OTP:", error);
        return false;
    }
};

// API to send password reset email
app.post("/send", async (req, res) => {
    const { email, name, otp } = req.body;

    if (!email || !name) {
        return res.status(400).json({ error: "Email and Name are required" });
    }

    // Generate OTP if not provided
    const otpCode = otp || Math.floor(100000 + Math.random() * 900000);

    // Update OTP in the database
    const otpUpdated = await updateOtpInDatabase(email, otpCode);

    if (!otpUpdated) {
        return res.status(500).json({ error: "Failed to update OTP in database" });
    }

    const mailOptions = {
        from: "sukumarm9339@gmail.com",
        to: email,
        subject: "Password Reset OTP",
        html: `<p>Hello <strong>${name}</strong>,</p>
               <p>Use the OTP below to reset your password. This OTP is valid for 10 minutes.</p>
               <h2 style="background: #f3f3f3; padding: 10px; text-align: center;">${otpCode}</h2>
               <p>If you did not request this, please ignore this email or contact support.</p>
               <p>For any assistance, contact us at <a href="mailto:support@ai-chatbot.com">support@ai-chatbot.com</a></p>`,
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: "Password reset email sent!", otp: otpCode });
    } catch (error) {
        console.error("Email sending error:", error);
        res.status(500).json({ error: "Failed to send email" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = router;