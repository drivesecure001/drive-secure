const express = require("express");
const router = express.Router();
const mongoose = require("mongoose"); 
const RenewalUser = require("../models/RenewalUser");
const adminToken = require("../middleware/adminAuth");
// Simple sanitizer function
router.get("/users", adminToken, async (req, res) => {
    try {
        if (req.query.search) {
            const searchTerm = req.query.search;
            const query = {};

            // Check if the search term looks like a valid ObjectId
            if (mongoose.isValidObjectId(searchTerm)) {
                query._id = searchTerm;
            } else {
                query.$or = [
                    { email: { $regex: searchTerm, $options: "i" } },
                    { fullName: { $regex: searchTerm, $options: "i" } },
                    { phoneNumber: { $regex: searchTerm, $options: "i" } },
                    // Add other fields you want to search
                ];
            }

            const users = await RenewalUser.find(query).select(
                "fullName email phoneNumber renewalCount _id"
            );
            return res.json(users);
        } else {
            const users = await RenewalUser.find(
                {},
                "fullName email phoneNumber renewalCount _id"
            );
            return res.json(users);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Internal server error" });
    }
});

router.get("/users/:id", async (req, res) => {
    try {
        const user = await RenewalUser.findById(req.params.id);
        if (!user) return res.status(404).json({ error: "User not found" });

        res.json(user);
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ error: "Error fetching user details" });
    }
});

router.delete('/users/:userId/renewals/:renewalIndex/documents/:documentIndex', adminToken, async (req, res) => {
    const { userId, renewalIndex, documentIndex } = req.params;

    try {
        const user = await RenewalUser.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.renewals || !user.renewals[renewalIndex]) {
            return res.status(404).json({ message: 'Renewal not found' });
        }

        const renewal = user.renewals[renewalIndex];

        if (!renewal.documents || !renewal.documents[documentIndex]) {
            return res.status(404).json({ message: 'Document not found' });
        }

        const documentToDelete = renewal.documents[documentIndex];

        const cloudinary = require('cloudinary').v2;
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });

        if (documentToDelete.publicId) {
            await cloudinary.uploader.destroy(documentToDelete.publicId);
        }

        renewal.documents.splice(documentIndex, 1);

        await user.save();

        res.status(200).json({ message: 'Document deleted successfully' });

    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({ message: 'Failed to delete document' });
    }
});

module.exports = router;
