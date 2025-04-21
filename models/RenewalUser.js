const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    documentType: {
        type: String,
        enum: ["image", "pdf", "doc"],
        required: true,
    },
});

const renewalSchema = new mongoose.Schema({
    registrationNumber: {
        type: String,
        required: true,
        uppercase: true,
    },
    registeredName: { type: String, required: true },
    contactNumber: { type: String, required: true },
    licenseExpiry: { type: Date, required: true },
    roadWorthinessExpiry: { type: Date, required: true },
    hackneyPermitExpiry: Date,
    insuranceExpiry: { type: Date, required: true },
    documents: [documentSchema],
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
    },
    createdAt: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema(
    {
        fullName: { type: String, required: true },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
        phoneNumber: { type: String, required: true },
        renewals: [renewalSchema],
        lastRenewalDate: Date,
        renewalCount: { type: Number, default: 0 },
    },
    { timestamps: true }
);

module.exports = mongoose.model("ReneualUser", userSchema);
