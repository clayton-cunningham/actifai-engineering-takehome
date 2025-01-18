'use strict';

const express = require('express');

const revenueControllers = require("../controllers/revenue-controllers");

const router = express.Router();

router.get("/averageForUser/:userId", revenueControllers.getAverageRevenueByUser);
router.get("/totalForUser/:userId", revenueControllers.getTotalRevenueByUser);

router.get("/averageForGroup/:groupId", revenueControllers.getAverageRevenueByGroup);
router.get("/totalForGroup/:groupId", revenueControllers.getTotalRevenueByGroup);

module.exports = router;