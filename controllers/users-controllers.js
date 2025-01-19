'use strict';

const { Client } = require('pg');
const queries = require("./queries");
const { validationResult } = require('express-validator');

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

    let user;
    try {
        user = (await pgclient.query(queries.getUserTableQuery(userId))).rows[0];
    } catch (e) {
        const error = new Error('Failed to retrieve a user, please try again at a later time', 500);
        return next (error);
    }

    if (!user) {
        const error = new Error("Could not find a user for the provided id.", 404);
        return next (error);
    }

    res.json({ user });
}

/**
 * Creates a user record
 *  * Note: we currently generate an id, but we may want to require a user id to be input for consistency with other records external to this system.
 * @param {name}    body The user's name'
 * @param {role}    body The user's role
 * @param {groupId} body The user group to add this user to
 */
const createUser = async (req, res, next) => {
    
    // Check input arguments for validity
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors);
        return next(new Error("Invalid input.", 422));
    }

    const { name, role, groupId } = req.body;

    // Obtain the maximum id for a user to generate a new id (*see note in function comment header)
    // Check that the group exists
    //  Note - we currently do not check if the user exists.  We may want to add this in the future (i.e. if we can assume a user's full name will be unique)
    let newUserId;
    let group;
    try {
        newUserId = parseInt((await pgclient.query(queries.getNewIdTableQuery('users'))).rows[0].id) + 1;
        group = (await pgclient.query(queries.getGroupTableQuery(groupId))).rows[0];
    } catch (e) {
        const error = new Error('Failed to access database, please try again at a later time', 500);
        return next (error);
    }

    // If the group specified doesn't exist, we cannot create a user
    if (!group) {
        const error = new Error("Could not find a group for the provided id.", 404);
        return next (error);
    }

    // Create a user
    try {
        await pgclient.query(queries.createUserTableQuery(newUserId, name, role, groupId));
    } catch (e) {
        const error = new Error('Failed to access database, please try again at a later time', 500);
        return next (error);
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

    let user;
    try {
        user = (await pgclient.query(queries.getUserTableQuery(userId))).rows[0];
    } catch (e) {
        const error = new Error('Failed to access database, please try again at a later time', 500);
        return next (error);
    }

    if (!user) {
        const error = new Error("Could not find a user for the provided id.", 404);
        return next (error);
    }

    if (fullDelete.toLowerCase() != 'true') {
        // Check the user's sales records.  If any exist, this request might be a mistake.  (* see note in function header comment)
        let sales;
        try {
            sales = (await pgclient.query(queries.getSalesByUserTableQuery(userId, 1))).rows;
        } catch (e) {
            const error = new Error(`Failed to access database, please try again at a later time`, 500);
            return next (error);
        }
    
        if (sales && sales.length > 0) {
            const error = new Error("This user has sales records.  Set the 'fullDelete' query parameter to true if this user should still be deleted, along with those records.", 417);
            return next (error);
        }
    }

    try {
        await pgclient.query(queries.deleteUserTableQuery(userId));
    } catch (e) {
        const error = new Error('Failed to access database, please try again at a later time', 500);
        return next (error);
    }
    
    res.status(204).json({});
}

module.exports = {
    getUserById,
    createUser,
    deleteUser
}
