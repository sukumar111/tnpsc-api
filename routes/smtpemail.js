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
        html: `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="utf-8">
    <meta content="width=device-width" name="viewport">
    <meta content="IE=edge" http-equiv="X-UA-Compatible">
    <meta name="x-apple-disable-message-reformatting">
    <title>FlexCub :: OTP for Password Reset</title>
    <link href="https://fonts.googleapis.com/css?family=Lato:300,400,700" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0 !important; mso-line-height-rule: exactly; background-color: #f1f1f1;" width="100%">
    <center style="width: 100%; background-color: #f1f1f1;">
        <div style="display: none; font-size: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all; font-family: sans-serif;">
            &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
        </div>
        <div class="email-container" style="max-width: 600px; margin: 0 auto;">
            <!-- BEGIN BODY -->
            <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
                   style="margin: auto; border:1px solid #cccccc; border-spacing:0; background:#fff; margin-top:5rem;"
                   width="100%">
                <tr>
                    <td class="bg_white" style="padding: 3em 2.5em 0 2.5em; text-align: center;" valign="top">
                        <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                            <tr>
                                <td class="logo" style="text-align: center;">
                                    <h1>OTP for Password Reset</h1>
                                </td>
                            </tr>
                            <tr>
                            </tr>
                        </table>
                    </td>
                </tr><!-- end tr -->
                <tr>
                    <td class="hero bg_white" style="padding: 2em 0 4em 0;" valign="middle">
                        <table>
                            <tr>
                                <td>
                                    <div class="text" style="padding: 0 2.5em; text-align: left;">
                                        <h2 style="text-align:left">Hello <strong>${name}</strong>,</h2>
                                        <h3>Use the OTP below to reset your password. This OTP is valid for 10 minutes.</h3>
                                        <h2 style="background: #f3f3f3; padding: 10px; text-align: center;">${otpCode}</h2>
                                        <h3>If you did not request this, please ignore this email or contact support.</h3>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div class="text" style="padding: 0 2.5em; text-align: left;">
                                        <h3>For any assistance, contact us at:</h3>
                                        <p>Email: <a href="mailto: support@tnpscplanner.com">support@tnpscplanner.com</a></p>
                                        <p>Phone: +1 (555) 123-4567</p>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div style="float:left">
                                        <h3 style="padding-right:52px">Thank you,</h3>
                                        <h4 style="padding-right:13px">TNPSC Study Planner</h4>
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr><!-- end tr -->
            </table>
        </div>
    </center>
</body>
</html>`,
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