'use strict';

const express = require('express');

const salesControllers = require("../controllers/sales-controllers");
const { check } = require('express-validator');

const router = express.Router();

router.get("/:saleId", 
    [
        check('saleId').isInt({min:1}),
    ],
    salesControllers.getSaleById);
router.get("/forUser/:userId", 
    [
        check('userId').isInt({min:1}),
        check('limit').isInt({min:1}),
    ],
    salesControllers.getSalesByUserId);

router.post("/",
    [
        check('userId').not().isEmpty().isInt({min:1}),
        check('amount').not().isEmpty().isInt({min:1}),
        check('date').not().isEmpty().isDate(),
    ],
    salesControllers.createSale
);

router.delete("/:saleId", 
    [
        check('saleId').isInt({min:1}),
    ],
    salesControllers.deleteSale);

module.exports = router;