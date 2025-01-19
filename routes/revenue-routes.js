'use strict';

const express = require('express');

const revenueControllers = require("../controllers/revenue-controllers");

const router = express.Router();

router.get("/byUser/:userId", revenueControllers.getRevenueByUser);
router.get("/", revenueControllers.getRevenue);

router.post("/", revenueControllers.revenuePostQuery);

module.exports = router;