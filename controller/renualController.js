const User = require("../models/RenewalUser");
const transporter = require("../config/mailer");
const emailTemplate = require("../utils/emailTemplate");
const { Types } = require("mongoose");
exports.registerVehicle = async (req, res) => {
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
