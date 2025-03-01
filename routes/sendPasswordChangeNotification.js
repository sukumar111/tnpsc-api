const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 7001;

app.use(express.json());
app.use(cors());

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: "sukumarm9339@gmail.com", // Your Gmail ID
        pass: "aqdzamketnrkccef", // App Password
    },
});

// Function to send password change notification
const sendPasswordChangeNotification = async (email, userName , message) => {
    const mailOptions = {
        from: "sukumarm9339@gmail.com",
        to: email, // Send to email if provided
        subject: message,
        html: `
            <!DOCTYPE html>
            <html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:th="http://www.thymeleaf.org">
            <head>
                <meta charset="utf-8">
                <meta content="width=device-width" name="viewport">
                <meta content="IE=edge" http-equiv="X-UA-Compatible">
                <meta name="x-apple-disable-message-reformatting">
                <title>FlexCub :: Password Successfully Updated</title>
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
                                                <h1>Password Updated Successfully</h1>
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
                                                    <h2 style="text-align:left">Hello ${userName}</h2>
                                                    <h3>Your password has been successfully updated!</h3>
                                                    <h3>If you made this change, no further action is required on your part.</h3>
                                                </div>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <div class="text" style="padding: 0 2.5em; text-align: left;">
                                                    <h3>For your security, please review the following:</h3>
                                                    <ul>
                                                        <li>Ensure your password is unique and not used on other platforms.</li>
                                                        <li>Enable two-factor authentication, if available, to add an extra layer of security.</li>
                                                        <li>Review recent account activity and report any suspicious actions.</li>
                                                    </ul>
                                                    <div style="text-align: left; padding-top: 1em;">
                                                        <h3>If you'd like to sign in now, please click the button below:</h3>
                                                        <a href="http://localhost:5173" style="display: inline-block; padding: 10px 20px; color: white; background-color: #4CAF50; border-radius: 5px; text-decoration: none; font-size: 16px;">Click here to Sign In</a>
                                                    </div>
                                                    <div style="text-align: left; padding-top: 1em;">
                                                        <h3 style="color:red">Disclaimer:</h3>
                                                        <h3>This message is intended only for the designated recipient and contains confidential information.</h3>
                                                        <h3>If you did not make this request, please contact us immediately at:</h3>
                                                        <p>Email: <a href="mailto:support@tnpscplanner.com">support@tnpscplanner.com</a></p>
                                                        <p>Phone: +1 (555) 123-4567</p>
                                                    </div>
                                                    <div style="float:left">
                                                        <h3 style="padding-right:52px">Thank you,</h3>
                                                        <h4 style="padding-right:13px">TNPSC Study Planner</h4>
                                                    </div>
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
            </html>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log("Password change notification sent successfully!");
    } catch (error) {
        console.error("Error sending password change notification:", error);
    }
};

// API endpoint for sending password change notification
app.post("/send-password-change-notification", async (req, res) => {
    const { email, userName, message } = req.body;

    if (!email) {
        return res.status(400).json({ error: "Email is required" });
    }

    try {
        await sendPasswordChangeNotification(email, userName, message);
        res.json({ success: true, message: "Password change notification sent!" });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Failed to send password change notification" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = router;