// middleware/authenticateTrigger.js
const TRIGGER_SECRET = process.env.RENEWAL_TRIGGER_SECRET;

if (!TRIGGER_SECRET) {
    console.warn(
        "CRITICAL: RENEWAL_TRIGGER_SECRET is not set in environment variables. The trigger endpoint will be insecure."
    );
}

const authenticateTrigger = (req, res, next) => {
    const providedSecret = req.headers["x-trigger-secret"];

    if (!TRIGGER_SECRET) {
        // Fail safe if secret is not configured on server
        console.error(
            "Trigger authentication cannot proceed: RENEWAL_TRIGGER_SECRET is not configured."
        );
        return res
            .status(500)
            .json({ message: "Server configuration error for trigger." });
    }

    if (providedSecret && providedSecret === TRIGGER_SECRET) {
        next(); // Authorized
    } else {
        console.warn("Unauthorized attempt to trigger renewal checks.");
        res.status(403).json({
            message: "Forbidden: Invalid or missing secret token.",
        });
    }
};

module.exports = authenticateTrigger;
