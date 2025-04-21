// routes/profile.js
const express = require("express");
const dotenv = require("dotenv");
const authenticateToken = require("../middleware/auth");
const User = require("../models/User");
const vehicleController = require("../controller/renualController");
const { single, array } = require("../middleware/upload");

dotenv.config();
const router = express.Router();

// GET user profile
router.get("/me", authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }
        res.json(user);
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});

// UPDATE profile with image upload
router.put(
    "/edit",
    authenticateToken,
    single("profilePicture"), // Use the single file upload middleware
    async (req, res) => {
        try {
            const user = await User.findById(req.user.userId);
            if (!user) return res.status(404).json({ error: "User not found" });

            // Update profile picture if uploaded
            if (req.file) {
                user.profilePicture = req.file.path;
            }

            // Update other fields
            Object.assign(user, req.body);
            await user.save();

            res.json({ message: "Profile updated successfully", user });
        } catch (error) {
            console.error("Error updating profile:", error);
            res.status(500).json({ error: "Server error" });
        }
    }
);

// Renewal reminder with optional file upload
router.post(
    "/reminder",
    array("documents", 10),
    (req, res, next) => {
        console.log("req.files:", req.files);
        console.log("req.body:", req.body);
        next();
    },
    vehicleController.registerVehicle
);

module.exports = router;
