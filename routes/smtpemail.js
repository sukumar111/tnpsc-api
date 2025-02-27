const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const router = express.Router();

const app = express();
const PORT = process.env.PORT || 7000;

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


app.post("/send", async (req, res) => {
    const { email } = req.body;
    res.send("API works");
    if (!email) {
        return res.status(400).json({ error: "Email is required" });
    }

    const mailOptions = {
        
        from: "sukumarm9339@gmail.com",
        to: email,
        subject: "Password Reset Request",
        text: "Click the link below to reset your password.",
        html: `<p>Click the link below to reset your password:</p>`,
    };

    try {
        await transporter.sendMail(mailOptions);
        // res.json({ success: true, message: "Password reset link sent successfully!" });
    } catch (error) {
        console.error("Email sending error:", error);
        res.status(500).json({ error: "Failed to send email" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = router;
