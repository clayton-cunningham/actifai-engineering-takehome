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
const validRoles =  [ 'Admin', 'Call Center Agent', 'Retail Agent' ];

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
    if (!sortBy || sortOptions.find(s => s == sortBy) == undefined) sortBy = 'month';
    if (!sortDirection || sortDirection != 'DESC' && sortDirection != 'ASC') sortDirection = 'ASC';

    let revenue;
    try {
        revenue = (await pgclient.query(queries.getRevenueByUserTableQuery(userId, fromMonth, fromYear, toMonth, toYear, sortBy, sortDirection))).rows;
    } catch (e) {
        const error = new Error('Failed to retrieve revenue, please try again', 500);
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
 * @param {groupId} req The group to retrieve sales for
 * @param {fromMonth}   query The first month to include
 * @param {fromYear}    query The first year to include
 * @param {toMonth}     query The last month to include
 * @param {toYear}      query The last year to include
 * @param {sortBy}              query Optional - the field to sort by (default: month)
 * @param {sortDirection}       query Optional - the direction to sort in (default: ASC)
 * @param {role}                query Optional - additional filter, to only aggregate on users with a specific role
 */
const getRevenueByGroup = async (req, res, next) => {
    const { groupId } = req.params;
    const { fromMonth, fromYear, toMonth, toYear } = req.query;
    let { sortBy, sortDirection, role } = req.query;

    if (!fromMonth || !fromYear || !toMonth || !toYear) {
        const error = new Error("Please add appropriate to and from dates, with a month and a year.", 400);
        return next(error);
    }
    if (!sortBy || sortOptions.find(s => s == sortBy.toLowerCase()) == undefined) sortBy = 'month';
    if (!sortDirection || sortDirection != 'DESC' && sortDirection != 'ASC') sortDirection = 'ASC';
    if (role && validRoles.find(r => r.toLowerCase() == role.toLowerCase()) == undefined) role = '';

    let revenue;
    try {
        revenue = (await pgclient.query(queries.getRevenueByGroupTableQueryRange(groupId, fromMonth, fromYear, toMonth, toYear, sortBy, sortDirection, role))).rows;
    } catch (e) {
        const error = new Error('Failed to retrieve revenue, please try again', 500);
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
