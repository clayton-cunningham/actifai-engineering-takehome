'use strict';

const { Client } = require('pg');
const queries = require("./queries");
const { validationResult } = require('express-validator');
const HttpError = require('../models/http-error');

const pgclient = new Client({
    host: 'db',
    port: '5432',
    user: 'user',
    password: 'pass',
    database: 'actifai'
});

pgclient.connect();

/**
 * Retrieves a group by id.
 * @param {groupId} params The group to retrieve
 */
const getGroupById = async (req, res, next) => {
    const groupId = req.params.groupId;

    let group;
    try {
        group = (await pgclient.query(queries.getGroupTableQuery(groupId))).rows[0];
    } catch (e) {
        return next(new HttpError('Failed to retrieve a group, please try again at a later time', 500));
    }

    if (!group) {
        return next(new HttpError("Could not find a group for the provided id.", 404));
    }

    res.json({ group });
}

/**
 * Creates a group record
 *  * Note: we currently generate an id, but we may want to require a group id to be input for consistency with other records external to this system.
 * @param {groupName}  body The group to add
 */
const createGroup = async (req, res, next) => {
    
    // Check input arguments for validity
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return next(new HttpError("Invalid input.", 422));
    }

    const { groupName } = req.body;

    let newGroupId;
    try {
        // Obtain the maximum id for a group to generate a new id (*see note in function comment header)
        newGroupId = parseInt((await pgclient.query(queries.getNewIdTableQuery('groups'))).rows[0].id) + 1;

        // Create a group
        await pgclient.query(queries.createGroupTableQuery(newGroupId, groupName));
    } catch (e) {
        return next(new HttpError('Failed to access database, please try again at a later time', 500));
    }
    
    res.status(201).json({ id: newGroupId });
}

/**
 * Deletes a group record
 * @param {groupId} params The group to delete
 */
const deleteGroup = async (req, res, next) => {
    const { groupId } = req.params;

    try {
        // Check if the group exists
        let group = (await pgclient.query(queries.getGroupTableQuery(groupId))).rows[0];
        if (!group) {
            return next(new HttpError("Could not find a group for the provided id.", 404));
        }

        // Check for users in the group.  If any exist, we do not allow the group to be deleted.
        let users = (await pgclient.query(queries.getUsersByGroupTableQuery(groupId))).rows;
        if (users && users.length > 0) {
            return next(new HttpError("This group has users.  Please delete those users or move them to other groups first.", 417));
        }

        // Delete the group
        await pgclient.query(queries.deleteGroupTableQuery(groupId));
    } catch (e) {
        return next(new HttpError('Failed to access database, please try again at a later time', 500));
    }
    
    res.status(204).json({});
}

module.exports = {
    getGroupById,
    createGroup,
    deleteGroup
}
