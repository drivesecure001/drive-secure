const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS,
    },
    // logger: true,
    // debug: true,
});

// transporter.verify(function (error, success) {
//     if (error) {
//         console.log("SMTP connection verification failed:", error);
//     } else {
//         console.log("SMTP server is ready to take our messages!");
//     }
// });

const sendOTP = async (email, otp) => {
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
            <h2 style="color: #2c3e50;">Email Verification</h2>
            <p style="font-size: 16px; color: #333;">Hi there,</p>
            <p style="font-size: 16px; color: #333;">
                Thank you for registering with us. To complete your signup process, please use the following One-Time Password (OTP):
            </p>
            <div style="text-align: center; margin: 30px 0;">
                <span style="display: inline-block; font-size: 28px; font-weight: bold; color: #ffffff; background-color: #2ecc71; padding: 12px 24px; border-radius: 6px;">
                    ${otp}
                </span>
            </div>
            <p style="font-size: 14px; color: #555;">
                This OTP is valid for <strong>5 minutes</strong>. Do not share this code with anyone.
            </p>
            <p style="font-size: 14px; color: #888;">
                If you didn’t request this, you can ignore this email safely.
            </p>
            <hr style="margin: 30px 0;">
            <p style="font-size: 12px; color: #aaa; text-align: center;">
                © ${new Date().getFullYear()} Your Drive Secure. All rights reserved.
            </p>
        </div>
    `;

    await transporter.sendMail({
        from: `"Drive Secure Admin" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Verify Your Email - Admin",
        text: `Your OTP is: ${otp}`,
        html: htmlContent,
    });
};
const sendEmail = async (to, subject, htmlBody) => {
    try {
        const mailOptions = {
            from: `"Drive Secure" <${process.env.EMAIL_USER}>`, 
            to: to, 
            subject: subject, 
            html: htmlBody, 
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${to}`);
    } catch (error) {
        console.error(`Error sending email to ${to}:`, error);
        throw error;
    }
};

module.exports = { sendEmail, sendOTP }; 
