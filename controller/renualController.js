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
                const subject = "Upcoming Renewal Reminder from Car Villa";
                let emailBody = `<p>Dear ${user.fullName},</p>`;
                emailBody +=
                    "<p>This is a friendly reminder from Car Villa that the following item(s) are due for renewal in 7 days:</p><ul>";

                upcomingExpiries.forEach((expiry) => {
                    emailBody += `<li><strong>${
                        expiry.type
                    }</strong> for vehicle registration <strong>${
                        expiry.registrationNumber
                    }</strong> (expiring on ${new Date(
                        expiry.date
                    ).toLocaleDateString()})</li>`;
                });

                emailBody +=
                    "</ul><p>Please log in to your Car Villa account to take the necessary actions.</p>";
                emailBody += "<p>Thank you,<br/>The Car Villa Team</p>";

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
