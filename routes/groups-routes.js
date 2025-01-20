'use strict';

const express = require('express');

const groupsControllers = require("../controllers/groups-controllers");
const { check } = require('express-validator');

const router = express.Router();

router.get("/:groupId", 
    [
        check('groupId').isInt({min:1}),
    ],
    groupsControllers.getGroupById);

router.post("/",
    [
        check('groupName').not().isEmpty(),
    ],
    groupsControllers.createGroup
);

router.delete("/:groupId", 
    [
        check('groupId').isInt({min:1}),
    ],
    groupsControllers.deleteGroup);

module.exports = router;