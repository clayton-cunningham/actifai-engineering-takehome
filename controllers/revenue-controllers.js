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
 * Retrieves the average sales revenue for a user.
 * @param {userId} req The user to retrieve average sales for
 */
const getAverageRevenueByUser = async (req, res, next) => {
    const userId = req.params.userId;
    
    let revenue;
    try {
        revenue = (await pgclient.query(queries.getAverageRevenueByUserTableQuery(userId))).rows[0].average;
    } catch (e) {
        const error = new Error('Failed to retrieve revenue, please try again', 500);
        return next(error);
    }

    if (!revenue) {
        const error = new Error("Could not find any revenue for the provided id.", 404);
        return next(error);
    }

    res.json({ averageRevenue : revenue });
}

/**
 * Retrieves the average sales revenue for a group of users.
 * @param {userId} req The group to retrieve average sales for
 */
const getAverageRevenueByGroup = async (req, res, next) => {
    const groupId = req.params.groupId;

    let revenue;
    try {
        revenue = (await pgclient.query(queries.getAverageRevenueByGroupTableQuery(groupId))).rows[0].average;
    } catch (e) {
        const error = new Error('Failed to retrieve revenue, please try again', 500);
        return next(error);
    }

    if (!revenue) {
        const error = new Error("Could not find any revenue for the provided id.", 404);
        return next(error);
    }

    res.json({ averageRevenue : revenue });
}

/**
 * Retrieves the total sales revenue for a user.
 * @param {groupId} req The user to retrieve sales for
 */
const getTotalRevenueByUser = async (req, res, next) => {
    const userId = req.params.userId;

    let revenue;
    try {
        revenue = (await pgclient.query(queries.getTotalRevenueByUserTableQuery(userId))).rows[0].total;
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
 * Retrieves the total sales revenue for a group.
 * @param {groupId} req The group to retrieve sales for
 */
const getTotalRevenueByGroup = async (req, res, next) => {
    const groupId = req.params.groupId;

    let revenue;
    try {
        revenue = (await pgclient.query(queries.getTotalRevenueByGroupTableQuery(groupId))).rows[0].total;
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

exports.getAverageRevenueByUser = getAverageRevenueByUser;
exports.getAverageRevenueByGroup = getAverageRevenueByGroup;
exports.getTotalRevenueByUser = getTotalRevenueByUser;
exports.getTotalRevenueByGroup = getTotalRevenueByGroup;