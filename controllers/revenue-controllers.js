'use strict';

const { Client } = require('pg');
const queries = require("./queries");

const pgclient = new Client({
    host: 'db',
    port: '5432',
    user: 'user',
    password: 'pass',
    database: 'actifai'
});

pgclient.connect();

const sortOptions = [ 'month', 'totalsalerevenue', 'numberofsales', 'averagerevenuebysales' ];

/**
 * Retrieves the sales revenue for a user.
 * @param {groupId} req The user to retrieve sales for
 * @param {fromMonth}   query The first month to include
 * @param {fromYear}    query The first year to include
 * @param {toMonth}     query The last month to include
 * @param {toYear}      query The last year to include
 * @param {sortBy}              query Optional - the field to sort by (default: month)
 * @param {sortDirection}       query Optional - the direction to sort in (default: ASC)
 */
const getRevenueByUser = async (req, res, next) => {
    const userId = req.params.userId;
    const { fromMonth, fromYear, toMonth, toYear } = req.query;
    let { sortBy, sortDirection } = req.query;

    if (!fromMonth || !fromYear || !toMonth || !toYear) {
        const error = new Error("Please add appropriate to and from dates, with a month and a year.", 400);
        return next(error);
    }
    if (!sortBy) sortBy = 'month';
    else if (sortOptions.find(s => s == sortBy.toLowerCase()) == undefined) {
        return next(new Error("Input sortBy is not supported.  Please use one of the following: " + sortOptions.toString(), 400));
    }
    if (!sortDirection) sortDirection = 'ASC';
    else if (sortDirection.toUpperCase() != 'DESC' && sortDirection.toUpperCase() != 'ASC') {
        return next(new Error("Input sortDirection is not supported.  Please use ASC or DESC.", 400));
    }

    let revenue;
    try {
        revenue = (await pgclient.query(queries.getRevenueByUserTableQuery(userId, fromMonth, fromYear, toMonth, toYear, sortBy, sortDirection))).rows;
    } catch (e) {
        const error = new Error('Failed to retrieve revenue, please try again at a later time', 500);
        return next(error);
    }

    if (!revenue) {
        const error = new Error("Could not find any revenue for the provided id.", 404);
        return next(error);
    }

    res.json({ revenueByMonth : revenue });
}

/**
 * Retrieves the sales revenue for a group.
 * @param {fromMonth}   query The first month to include
 * @param {fromYear}    query The first year to include
 * @param {toMonth}     query The last month to include
 * @param {toYear}      query The last year to include
 * @param {groupId}             query Optional - additional filter, to only aggregate on users of a specific group
 * @param {role}                query Optional - additional filter, to only aggregate on users with a specific role
 * @param {sortBy}              query Optional - the field to sort by (default: month)
 * @param {sortDirection}       query Optional - the direction to sort in (default: ASC)
 */
const getRevenueByGroup = async (req, res, next) => {
    const { fromMonth, fromYear, toMonth, toYear } = req.query;
    let { groupId, role, sortBy, sortDirection } = req.query;

    if (!fromMonth || !fromYear || !toMonth || !toYear) {
        return next(new Error("Please add appropriate to and from dates, with a month and a year.", 400));
    }
    if (!sortBy) sortBy = 'month';
    else if (sortOptions.find(s => s == sortBy.toLowerCase()) == undefined) {
        return next(new Error("Input sortBy is not supported.  Please use one of the following: " + sortOptions.toString(), 400));
    }
    if (!sortDirection) sortDirection = 'ASC';
    else if (sortDirection.toUpperCase() != 'DESC' && sortDirection.toUpperCase() != 'ASC') {
        return next(new Error("Input sortDirection is not supported.  Please use ASC or DESC.", 400));
    }
    if (groupId) {
        // Check that this group exists
        let group = (await pgclient.query(queries.getGroupTableQuery(groupId))).rows[0];
        if (!group) {
            return next(new Error("Could not find a group for the provided id.", 404));
        }
    }
    if (role) {
        // Check that this role exists
        let usersForRole = (await pgclient.query(queries.getUsersByRoleTableQuery(role))).rows;
        if (!usersForRole || usersForRole.length == 0) {
            return next(new Error("Could not find any users with the provided role.", 404));
        }
    }

    let revenue;
    try {
        revenue = (await pgclient.query(queries.getRevenueByGroupTableQueryRange(fromMonth, fromYear, toMonth, toYear, groupId, role, sortBy, sortDirection))).rows;
    } catch (e) {
        const error = new Error('Failed to retrieve revenue, please try again at a later time', 500);
        return next(error);
    }

    if (!revenue) {
        const error = new Error("Could not find any revenue for the provided id.", 404);
        return next(error);
    }

    res.json({ revenueByMonth : revenue });
}

module.exports = {
    getRevenueByUser,
    getRevenueByGroup
}
