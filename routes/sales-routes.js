'use strict';

const express = require('express');

const salesControllers = require("../controllers/sales-controllers");

const router = express.Router();

router.get("/:saleId", salesControllers.getSaleById);
router.get("/user/:userId", salesControllers.getSalesByUserId);

module.exports = router;