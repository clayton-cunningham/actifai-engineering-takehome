'use strict';

const express = require('express');

const usersControllers = require("../controllers/users-controllers");
const { check } = require('express-validator');

const router = express.Router();

router.get("/:userId", usersControllers.getUserById);

router.post("/",
    [
        check('name').not().isEmpty(),
        check('role').not().isEmpty(),
        check('groupId').not().isEmpty(),
    ],
    usersControllers.createUser
);

router.delete("/:userId", usersControllers.deleteUser);

router.patch("/:userId", usersControllers.editUser);

module.exports = router;