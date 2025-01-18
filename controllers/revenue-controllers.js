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

/**
 * Retrieves the sales revenue for a user.
 * @param {groupId} req The user to retrieve sales for
 */
const getRevenueByUser = async (req, res, next) => {
    const userId = req.params.userId;

    let revenue;
    try {
        revenue = (await pgclient.query(queries.getRevenueByUserTableQuery(userId))).rows;
    } catch (e) {
        const error = new Error('Failed to retrieve revenue, please try again', 500);
        return next(error);
    }

    if (!revenue) {
        const error = new Error("Could not find any revenue for the provided id.", 404);
        return next(error);
    }

    res.json({ totalRevenue : revenue });
}

/**
 * Retrieves the sales revenue for a group.
 * @param {groupId} req The group to retrieve sales for
 * @param {fromMonth}   query The first month to include
 * @param {fromYear}    query The first year to include
 * @param {toMonth}     query The last month to include
 * @param {toYear}      query The last year to include
 */
const getRevenueByGroup = async (req, res, next) => {
    const { groupId } = req.params;
    const { fromMonth, fromYear, toMonth, toYear } = req.query;

    if (!fromMonth || !fromYear || !toMonth || !toYear) {
        const error = new Error("Please add appropriate to and from dates, with a month and a year.", 400);
        return next(error);
    }

    let revenue;
    try {
        revenue = (await pgclient.query(queries.getRevenueByGroupTableQueryRange(groupId, fromMonth, fromYear, toMonth, toYear))).rows;
    } catch (e) {
        const error = new Error('Failed to retrieve revenue, please try again', 500);
        return next(error);
    }

    if (!revenue) {
        const error = new Error("Could not find any revenue for the provided id.", 404);
        return next(error);
    }

    res.json({ totalRevenue : revenue });
}

exports.getRevenueByUser = getRevenueByUser;
exports.getRevenueByGroup = getRevenueByGroup;