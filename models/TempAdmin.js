const mongoose = require("mongoose");

const TempAdminSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true,
        match: [/\S+@\S+\.\S+/, "Please use a valid email address"],
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    whatsapp: {
        type: String,
        trim: true,
    },
    country: {
        type: String,
        required: true,
    },
    state: {
        type: String,
        required: true,
    },
    profilePicture: { type: String, default: "" },
    otp: { type: String, required: true },
    otpExpires: { type: Date, required: true },

    createdAt: { type: Date, default: Date.now, expires: 300 }, // 5 minutes = 300 seconds
});

module.exports = mongoose.model("TempAdmin", TempAdminSchema);
