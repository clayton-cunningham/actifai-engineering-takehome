'use strict';

const express = require('express');

const groupsControllers = require("../controllers/groups-controllers");
const { check } = require('express-validator');

const router = express.Router();

router.get("/:groupId", groupsControllers.getGroupById);

router.post("/",
    [
        check('groupName').not().isEmpty(),
    ],
    groupsControllers.createGroup
);

router.delete("/:groupId", groupsControllers.deleteGroup);

module.exports = router;