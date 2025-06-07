require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const adminRoutes = require("./routes/admin");
const adminRoutesRenewal = require("./routes/adminRenewalUsers");
const renewalRoutes = require("./routes/renewalRoutes")

const app = express();

app.set("trust proxy", 1);
app.use(express.json());
app.use(
    cors({
        origin: ["http://127.0.0.1:5500", "https://vehicleregistration.ng"],
        credentials: true,
        methods: "GET, POST, PUT, DELETE, OPTIONS",
        allowedHeaders: "Content-Type, Authorization, X-Trigger-Secret",
    })
);
app.use(helmet());

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// Connect to MongoDB
mongoose
    .connect(process.env.MONGO_URI, {})
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => console.error(err));

app.use("/auth", authRoutes);
app.use("/profile", profileRoutes);
app.use("/admin", adminRoutes);
app.use("/admin-renewal", adminRoutesRenewal);
app.use("/renewals", renewalRoutes);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
