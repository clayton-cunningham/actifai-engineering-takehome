'use strict';

const express = require('express');

const revenueControllers = require("../controllers/revenue-controllers");
const { check } = require('express-validator');

const router = express.Router();

router.get("/byUser/:userId", 
    [
        check(['fromMonth', 'toMonth']).not().isEmpty().trim().isLength({min:2, max:2}).isInt({min:1, max:12}),
        check(['fromYear', 'toYear']).not().isEmpty().trim().isLength({min:4, max:4}).isInt({min:1000, max:9999}),
        check('sortBy').optional().trim().isString(),
        check('sortDirection').optional().trim().isString(),
    ],
    revenueControllers.getRevenueByUser);
router.get("/", 
    [
        check(['fromMonth', 'toMonth']).not().isEmpty().trim().isLength({min:2, max:2}).isInt({min:1, max:12}),
        check(['fromYear', 'toYear']).not().isEmpty().trim().isLength({min:4, max:4}).isInt({min:1000, max:9999}),
        check('groupId').optional().trim().isInt({min:1}),
        check('role').optional().trim().isString(),
        check('sortBy').optional().trim().isString(),
        check('sortDirection').optional().trim().isString(),
        check('getUserInfo').optional().trim().isBoolean(),
    ],
    revenueControllers.getRevenue);

router.post("/", 
    [
        check(['fromMonth', 'toMonth']).not().isEmpty().trim().isLength({min:2, max:2}).isInt({min:1, max:12}),
        check(['fromYear', 'toYear']).not().isEmpty().trim().isLength({min:4, max:4}).isInt({min:1000, max:9999}),
        check('groupIds').optional().trim().isArray().isInt({min:1}),
        check('roles').optional().trim().isArray(),
        check('sortBy').optional().trim().isString(),
        check('sortDirection').optional().trim().isString(),
        check('getUserInfo').optional().trim().isBoolean(),
    ],
    revenueControllers.revenuePostQuery);

module.exports = router;