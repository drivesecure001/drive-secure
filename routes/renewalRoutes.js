// routes/renewalRoutes.js
const express = require('express');
const router = express.Router();
const { triggerRenewalChecks } = require('../controllers/renewalController');
const authenticateTrigger = require('../middleware/authenticateTrigger');

// POST /api/renewals/trigger-checks
// This endpoint will start the renewal check process.
router.post('/trigger-checks', authenticateTrigger, triggerRenewalChecks);

module.exports = router;