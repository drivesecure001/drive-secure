// routes/renewalRoutes.js
const express = require('express');
const router = express.Router();
const { triggerRenewalChecks } = require('../controller/renualController');
const authenticateTrigger = require('../middleware/authenticateTrigger');

router.post('/trigger-checks', authenticateTrigger, triggerRenewalChecks);

module.exports = router;