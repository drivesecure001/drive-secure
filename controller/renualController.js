const User = require("../models/RenewalUser");
const transporter = require("../config/mailer");
const emailTemplate = require("../utils/emailTemplate");
const { Types } = require("mongoose");
const { sendEmail } = require("../utils/nodemailer");
const registerVehicle = async (req, res) => {
    try {
        const {
            fullName,
            email,
            userPhoneNumber,
            registrationNumber,
            registeredName,
            phoneNumber,
            vehicleLicense,
            roadWorthiness,
            hackneyPermit,
            insurance,
        } = req.body;

        // Find existing user or create new one
        let user = await User.findOne({ email });

        if (!user) {
            user = new User({
                fullName,
                email,
                phoneNumber: userPhoneNumber,
                renewals: [],
            });
        }

        // Process uploaded documents
        const documents = Array.isArray(req.files)
            ? req.files.map((file) => ({
                  url: file.path,
                  publicId: file.filename,
                  documentType: file.mimetype.startsWith("image")
                      ? "image"
                      : file.mimetype === "application/pdf"
                      ? "pdf"
                      : "doc",
              }))
            : [];

        // Create new renewal record
        const newRenewal = {
            _id: new Types.ObjectId(),
            registrationNumber: registrationNumber.toUpperCase(),
            registeredName,
            contactNumber: phoneNumber,
            licenseExpiry: new Date(vehicleLicense),
            roadWorthinessExpiry: new Date(roadWorthiness),
            hackneyPermitExpiry: hackneyPermit
                ? new Date(hackneyPermit)
                : undefined,
            insuranceExpiry: new Date(insurance),
            documents,
            status: "pending",
        };

        // Add renewal to user's renewals array
        user.renewals.push(newRenewal);
        user.renewalCount = user.renewals.length;
        user.lastRenewalDate = new Date();

        await user.save();

        // Send confirmation email
        // Send confirmation email to user
        const userMailOptions = {
            from: `"Drive Secure" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Vehicle Renewal Reminder Successful",
            html: emailTemplate.vehicleRegistration(fullName, newRenewal),
        };

        // Send notification email to the website owner
        const adminMailOptions = {
            from: `"Drive Secure Admin" <${process.env.EMAIL_USER}>`,
            to: "info@vehicleregistration.ng", // Website owner's email
            subject: `New Vehicle Renewal Submitted by ${fullName}`,
            html: emailTemplate.adminNotification(
                fullName,
                email,
                newRenewal,
                req.files
            ),
        };

        // Send both emails in parallel
        await Promise.all([
            transporter.sendMail(userMailOptions),
            transporter.sendMail(adminMailOptions),
        ]);

        // transporter.verify(function (error, success) {
        //     if (error) {
        //         console.error("Email Transporter Error:", error);
        //     } else {
        //         console.log("Email transporter is ready to send messages");
        //     }
        // });

        res.status(201).json({
            success: true,
            message: "Vehicle registration submitted successfully",
            renewal: newRenewal,
            renewalCount: user.renewalCount,
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({
            success: false,
            message: "Server error during registration",
            error: error.message,
        });
    }
};
const checkAndSendRenewalReminders = async () => {
    console.log("Starting checkAndSendRenewalReminders process...");
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to the beginning of the day

        const sevenDaysFromNow = new Date(today);
        sevenDaysFromNow.setDate(today.getDate() + 7);
        sevenDaysFromNow.setHours(0, 0, 0, 0); // Normalize

        console.log(
            `Checking for renewals expiring on: ${sevenDaysFromNow.toDateString()}`
        );

        // Find all users. For very large databases, consider batching or more targeted queries.
        const users = await User.find({});

        if (!users || users.length === 0) {
            console.log("No users found for renewal checks.");
            return;
        }

        let emailsSentCount = 0;
        for (const user of users) {
            if (!user.renewals || user.renewals.length === 0) {
                continue; // Skip users with no renewals
            }

            const upcomingExpiries = [];

            for (const renewal of user.renewals) {
                // Helper function to compare dates (ignoring time)
                const isDateSevenDaysFromNow = (expiryDate) => {
                    if (!expiryDate) return false;
                    const normalizedExpiryDate = new Date(expiryDate);
                    normalizedExpiryDate.setHours(0, 0, 0, 0);
                    return (
                        normalizedExpiryDate.getTime() ===
                        sevenDaysFromNow.getTime()
                    );
                };

                if (isDateSevenDaysFromNow(renewal.licenseExpiry)) {
                    upcomingExpiries.push({
                        type: "Vehicle License",
                        date: renewal.licenseExpiry,
                        registrationNumber: renewal.registrationNumber,
                    });
                }
                if (isDateSevenDaysFromNow(renewal.roadWorthinessExpiry)) {
                    upcomingExpiries.push({
                        type: "Road Worthiness",
                        date: renewal.roadWorthinessExpiry,
                        registrationNumber: renewal.registrationNumber,
                    });
                }
                if (
                    renewal.hackneyPermitExpiry &&
                    isDateSevenDaysFromNow(renewal.hackneyPermitExpiry)
                ) {
                    upcomingExpiries.push({
                        type: "Hackney Permit",
                        date: renewal.hackneyPermitExpiry,
                        registrationNumber: renewal.registrationNumber,
                    });
                }
                if (isDateSevenDaysFromNow(renewal.insuranceExpiry)) {
                    upcomingExpiries.push({
                        type: "Insurance",
                        date: renewal.insuranceExpiry,
                        registrationNumber: renewal.registrationNumber,
                    });
                }
            }

            if (upcomingExpiries.length > 0) {
                const subject = "Important: Your Vehicle Renewal is Due Soon!";

                // Start with the main container and header
                let emailBody = `
                    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 20px auto; background-color: #f8f8f8; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                        <div style="background-color: #007bff; color: #ffffff; padding: 25px 30px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px;">
                            <h1 style="margin: 0; font-size: 28px; font-weight: 600;">Drive Secure</h1>
                            <p style="margin: 5px 0 0; font-size: 16px;">Your Trusted Vehicle Companion</p>
                        </div>
                        <div style="padding: 30px;">
                            <p style="font-size: 16px; margin-bottom: 20px;">Dear <strong>${user.fullName}</strong>,</p>
                            <p style="font-size: 16px; margin-bottom: 25px;">
                                This is an important heads-up from **Drive Secure**! The following item(s) related to your vehicle(s) are due for renewal in <strong>7 days</strong>:
                            </p>
                            <div style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 6px; padding: 20px 25px; margin-bottom: 25px;">
                                <ul style="list-style: none; padding: 0; margin: 0;">
                `;

                // Add each expiring item dynamically
                upcomingExpiries.forEach((expiry) => {
                    emailBody += `
                                    <li style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
                                        <p style="font-size: 15px; margin: 0;">
                                            <strong style="color: #007bff;">${
                                                expiry.type
                                            }</strong> for vehicle registration 
                                            <strong style="color: #555;">${
                                                expiry.registrationNumber
                                            }</strong>
                                        </p>
                                        <p style="font-size: 14px; color: #777; margin: 5px 0 0;">
                                            Expiring on: <strong>${new Date(
                                                expiry.date
                                            ).toLocaleDateString("en-US", {
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                            })}</strong>
                                        </p>
                                    </li>
                    `;
                });

                // Close the list and add the call to action and footer
                emailBody += `
                                </ul>
                            </div>
                            <p style="font-size: 16px; margin-bottom: 25px;">
                                Please log in to your Drive Secure account at your earliest convenience to review these items and take the necessary actions to avoid any service interruptions or penalties.
                            </p>
                            <div style="text-align: center; margin-top: 30px; margin-bottom: 30px;">
                                <a href="YOUR_LOGIN_PAGE_URL" style="display: inline-block; padding: 12px 25px; background-color: #28a745; color: #ffffff; text-decoration: none; border-radius: 5px; font-size: 17px; font-weight: bold;">
                                    Log In to Your Account
                                </a>
                            </div>
                            <p style="font-size: 15px; margin-bottom: 10px;">Thank you for choosing Drive Secure!</p>
                            <p style="font-size: 15px; margin-bottom: 0;">Best regards,</p>
                            <p style="font-size: 15px; margin-top: 0; color: #007bff;">The Drive Secure Team</p>
                        </div>
                        <div style="background-color: #f1f1f1; padding: 20px; text-align: center; font-size: 12px; color: #888; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
                            <p style="margin: 0;">&copy; ${new Date().getFullYear()} Drive Secure. All rights reserved.</p>
                            <p style="margin: 5px 0 0;">This is an automated email, please do not reply.</p>
                        </div>
                    </div>
                `;

                try {
                    await sendEmail(user.email, subject, emailBody);
                    console.log(
                        `Reminder email sent to ${user.email} for ${upcomingExpiries.length} item(s).`
                    );
                    emailsSentCount++;
                } catch (emailError) {
                    console.error(
                        `Failed to send email to ${user.email}:`,
                        emailError
                    );
                    // Decide if you want to stop the whole process or continue
                }
            }
        }
        console.log(
            `Finished renewal checks. Total emails sent: ${emailsSentCount}.`
        );
    } catch (error) {
        console.error(
            "Error in checkAndSendRenewalReminders background process:",
            error
        );
    }
};

// Controller function to be called by the route
const triggerRenewalChecks = (req, res) => {
    console.log("Received HTTP request to trigger renewal checks.");

    
    checkAndSendRenewalReminders().catch((err) => {
        console.error(
            "Unhandled error from background renewal check initiated by HTTP request:",
            err
        );
    });

    res.status(202).json({
        message: "Renewal check process initiated successfully.",
    });
};

module.exports = {
    registerVehicle,
    checkAndSendRenewalReminders, // Export if you want to call it directly elsewhere (e.g., a true cron)
    triggerRenewalChecks,
};
