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
 * Retrieves a user by id.
 * @param {userId} params The user to retrieve
 */
const getUserById = async (req, res, next) => {
    const userId = req.params.userId;
    
    // Check input arguments for validity
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return next(new HttpError("Invalid input.", 422));
    }

    let user;
    try {
        user = (await pgclient.query(queries.getUserTableQuery(userId))).rows[0];
    } catch (e) {
        return next(new HttpError('Failed to retrieve a user, please try again at a later time', 500));
    }

    if (!user) {
        return next(new HttpError("Could not find a user for the provided id.", 404));
    }

    res.json({ user });
}

/**
 * Creates a user record
 *  * Note: we currently generate an id, but we may want to require a user id to be input for consistency with other records external to this system.
 *    Note 2 - we check if the group exist, but not if the user already exists.  We may want to add this in the future (i.e. if we can assume a user's full name will be unique)
 * @param {name}    body The user's name
 * @param {role}    body The user's role
 * @param {groupId} body The user group to add this user to
 */
const createUser = async (req, res, next) => {
    
    // Check input arguments for validity
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return next(new HttpError("Invalid input.", 422));
    }

    const { name, role, groupId } = req.body;

    let newUserId;
    try {
        // Check that the group exists.  If not, we cannot create a user
        let group = (await pgclient.query(queries.getGroupTableQuery(groupId))).rows[0];
        if (!group) {
            return next(new HttpError("Could not find a group for the provided id.", 404));
        }

        // Obtain the maximum id for a user to generate a new id (*see note in function comment header)
        newUserId = parseInt((await pgclient.query(queries.getNewIdTableQuery('users'))).rows[0].id) + 1;

        // Create a user
        await pgclient.query(queries.createUserQuery(newUserId, name, role, groupId));
    } catch (e) {
        return next(new HttpError('Failed to access database, please try again at a later time', 500));
    }
    
    res.status(201).json({ id: newUserId });
}

/**
 * Deletes a user record
 * @param {userId}      params The user to delete
 * @param {fullDelete}  query  * Optional - When false, if the user has sales, we halt deletion.  When true, we will delete user regardless along with their sales.
 */
const deleteUser = async (req, res, next) => {
    const { userId } = req.params;
    const { fullDelete } = req.query;
    
    // Check input arguments for validity
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return next(new HttpError("Invalid input.", 422));
    }

    try {
        // Check if user exists
        let user = (await pgclient.query(queries.getUserTableQuery(userId))).rows[0];
        if (!user) {
            return next(new HttpError("Could not find a user for the provided id.", 404));
        }
        
        if (!fullDelete || fullDelete.toLowerCase() != 'true') {
            // Check the user's sales records.  If any exist, this request might be a mistake.  (* see note in function header comment)
            let sales = (await pgclient.query(queries.getSalesByUserTableQuery(userId, 1))).rows;
            if (sales && sales.length > 0) {
                return next(new HttpError("This user has sales records.  Set the 'fullDelete' query parameter to true if this user should still be deleted, along with those records.", 417));
            }
        }

        // Delete the user
        await pgclient.query(queries.deleteUserTableQuery(userId));
    } catch (e) {
        return next(new HttpError('Failed to access database, please try again at a later time', 500));
    }
    
    res.status(204).json({});
}

/**
 * Edit a user record
 * @param {name}    body The user's name
 * @param {role}    body The user's role
 * @param {groupId} body The user group to add this user to
 */
const editUser = async (req, res, next) => {
    const { userId } = req.params;
    
    // Check input arguments for validity
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return next(new HttpError("Invalid input.", 422));
    }

    const { name, role, groupId } = req.body;

    try {
        // Check if user exists
        let user = (await pgclient.query(queries.getUserTableQuery(userId))).rows[0];
        if (!user) {
            return next(new HttpError("Could not find a user for the provided id.", 404));
        }

        if (groupId) {
            // If the user is being moved to a different group, check that the group exists.
            let group = (await pgclient.query(queries.getGroupTableQuery(groupId))).rows[0];
            if (!group) {
                return next(new HttpError("Could not find a group for the provided id.", 404));
            }
        }

        // Create a user
        await pgclient.query(queries.editUserQuery(userId, name, role, groupId));
    } catch (e) {
        return next(new HttpError('Failed to access database, please try again at a later time', 500));
    }
    
    res.status(204).json({});
}

module.exports = {
    getUserById,
    createUser,
    deleteUser,
    editUser
}
