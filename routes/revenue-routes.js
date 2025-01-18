'use strict';

const express = require('express');

const revenueControllers = require("../controllers/revenue-controllers");

const router = express.Router();

router.get("/byUser/:userId", revenueControllers.getRevenueByUser);
router.get("/byGroup/:groupId", revenueControllers.getRevenueByGroup);

module.exports = router;