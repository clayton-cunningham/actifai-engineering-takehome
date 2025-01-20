'use strict';

const express = require('express');

const usersControllers = require("../controllers/users-controllers");
const { check } = require('express-validator');

const router = express.Router();

router.get("/:userId", 
    [
        check('userId').isInt({min:1}),
    ],
    usersControllers.getUserById);

router.post("/",
    [
        check('name').not().isEmpty().isString(),
        check('role').not().isEmpty().isString(),
        check('groupId').not().isEmpty().isInt({min:1}),
    ],
    usersControllers.createUser
);

router.delete("/:userId", 
    [
        check('userId').isInt({min:1}),
        check('fullDelete').isBoolean(),
    ],
    usersControllers.deleteUser);

router.patch("/:userId", 
    [
        check('userId').isInt({min:1}),
        check('name').optional().isString(),
        check('role').optional().isString(),
        check('groupId').optional().isInt({min:1}),
    ],
    usersControllers.editUser);

module.exports = router;