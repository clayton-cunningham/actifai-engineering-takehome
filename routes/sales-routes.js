'use strict';

const express = require('express');

const salesControllers = require("../controllers/sales-controllers");
const { check } = require('express-validator');

const router = express.Router();

router.get("/:saleId", salesControllers.getSaleById);
router.get("/forUser/:userId", salesControllers.getSalesByUserId);

router.post("/",
    [
        check('userId').not().isEmpty(),
        check('amount').not().isEmpty(),
        check('date').not().isEmpty(),
    ],
    salesControllers.createSale
);

router.delete("/:saleId", salesControllers.deleteSale);

module.exports = router;